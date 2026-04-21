import { qrRepository } from "../repositories/qrRepository";
import { userRepository } from "../repositories/userRepository";
import { accessLogRepository } from "../repositories/accessLogRepository";
import { publishAccessResult, type AccessResultPayload } from "../events/bus";
import { daysRemaining } from "./authService";
import { kioskService } from "./kioskService";
import { NotFoundError } from "../errors";

export const accessService = {
  /**
   * Flujo NUEVO (principal):
   * El socio escanea desde su app el QR mostrado por la pantalla kiosk.
   * - kioskToken: token single-use emitido por el kiosk
   * - userId: del socio autenticado (cookie)
   */
  async checkIn(params: { userId: string; kioskToken: string }): Promise<AccessResultPayload> {
    // validateToken lanza ValidationError si el token es inválido/expirado
    const { sessionId, gymId } = await kioskService.validateToken(params.kioskToken);

    const user = await userRepository.findByIdWithRelations(params.userId);
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const membership = user.memberships[0] ?? null;
    const dr = membership ? daysRemaining(membership.endDate) : 0;
    const active = !!membership && membership.status === "active" && dr > 0;

    const payload: AccessResultPayload = {
      status: active ? "granted" : "denied",
      user: { name: user.name, photoUrl: user.photoUrl },
      membership: { daysRemaining: dr },
      message: active ? "Acceso permitido" : "Membresía vencida",
      // Se prioriza el gymId del usuario; el kiosk puede no tener gymId asignado.
      gymId: user.gymId ?? gymId ?? null,
      kioskSessionId: sessionId,
      timestamp: new Date().toISOString(),
    };

    await accessLogRepository.create({
      userId: user.id,
      gymId: payload.gymId,
      status: payload.status,
      reason: active ? null : "membership_expired",
    });

    await publishAccessResult(payload);
    return payload;
  },

  /**
   * Flujo "Avisar al personal": el socio aprieta un botón en su dashboard
   * en vez de escanear el QR. Efecto idéntico al check-in por QR:
   *  - Registra AccessLog.
   *  - Publica el evento al kiosk del gym (última sesión activa).
   *  - Si no hay kiosk activo, el log queda igualmente y el evento se emite
   *    como broadcast (kioskSessionId null) por si alguna pantalla escucha.
   */
  async notifyStaff(params: { userId: string }): Promise<AccessResultPayload> {
    const user = await userRepository.findByIdWithRelations(params.userId);
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const membership = user.memberships[0] ?? null;
    const dr = membership ? daysRemaining(membership.endDate) : 0;
    const active = !!membership && membership.status === "active" && dr > 0;

    const kiosk = await kioskService.findLatestSessionByGym(user.gymId ?? null);

    const payload: AccessResultPayload = {
      status: active ? "granted" : "denied",
      user: { name: user.name, photoUrl: user.photoUrl },
      membership: { daysRemaining: dr },
      message: active ? "Acceso permitido" : "Membresía vencida",
      gymId: user.gymId ?? kiosk?.gymId ?? null,
      kioskSessionId: kiosk?.sessionId ?? null,
      timestamp: new Date().toISOString(),
    };

    await accessLogRepository.create({
      userId: user.id,
      gymId: payload.gymId,
      status: payload.status,
      reason: active ? null : "membership_expired",
    });

    await publishAccessResult(payload);
    return payload;
  },

  /**
   * Flujo LEGACY (lector físico en la puerta que escanea el QR personal del socio).
   * Se mantiene por compatibilidad. Emite evento broadcast (kioskSessionId: null).
   */
  async validateAndLog(code: string): Promise<AccessResultPayload> {
    const qr = await qrRepository.findByCode(code);

    if (!qr || !qr.active) {
      const payload: AccessResultPayload = {
        status: "denied",
        user: { name: "Desconocido", photoUrl: null },
        membership: { daysRemaining: 0 },
        message: "QR no válido o inactivo",
        gymId: null,
        kioskSessionId: null,
        timestamp: new Date().toISOString(),
      };
      await accessLogRepository.create({
        userId: qr?.userId ?? null,
        gymId: null,
        status: "denied",
        reason: "qr_invalid",
      });
      await publishAccessResult(payload);
      return payload;
    }

    const membership = qr.user.memberships[0] ?? null;
    const dr = membership ? daysRemaining(membership.endDate) : 0;
    const active = !!membership && membership.status === "active" && dr > 0;

    const payload: AccessResultPayload = {
      status: active ? "granted" : "denied",
      user: { name: qr.user.name, photoUrl: qr.user.photoUrl },
      membership: { daysRemaining: dr },
      message: active ? "Acceso permitido" : "Membresía vencida",
      gymId: qr.user.gymId,
      kioskSessionId: null,
      timestamp: new Date().toISOString(),
    };
    await accessLogRepository.create({
      userId: qr.userId,
      gymId: qr.user.gymId,
      status: payload.status,
      reason: active ? null : "membership_expired",
    });
    await publishAccessResult(payload);
    return payload;
  },
};
