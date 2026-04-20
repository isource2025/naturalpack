import { ConflictError, NotFoundError, UnauthorizedError } from "../errors";
import { hashPassword, signToken, verifyPassword, type JwtPayload } from "../auth";
import { userRepository } from "../repositories/userRepository";
import { gymRepository } from "../repositories/gymRepository";
import { qrRepository } from "../repositories/qrRepository";
import { membershipRepository } from "../repositories/membershipRepository";
import { ensureGymActive } from "./gymGuard";
import { generateQRValue } from "../qr";
import type {
  AdminCreateUserInput,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  Role,
} from "../dtos";

const DEFAULT_TRIAL_DAYS = 30;

/** Convierte "Mi Gym Crossfit 2026" → "mi-gym-crossfit-2026". */
export function slugifyGym(raw: string): string {
  const base = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "gym";
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("El email ya está registrado");

    let gymId: string;
    let role: Role;
    let createTrial = false;

    if (input.mode === "owner") {
      const slug = slugifyGym(input.gymName);
      const existingGym = await gymRepository.findBySlug(slug);
      if (existingGym) {
        throw new ConflictError(
          `Ya existe un gimnasio con ese nombre (código: ${slug}). Probá otro nombre.`
        );
      }
      const created = await gymRepository.create({
        slug,
        name: input.gymName,
      });
      gymId = created.id;
      role = "admin";
    } else {
      const gym = await gymRepository.findBySlug(input.gymSlug);
      if (!gym) {
        throw new NotFoundError(
          "No encontramos ese gimnasio. Pedile el código al personal del gym."
        );
      }
      gymId = gym.id;
      role = "client";
      createTrial = true;
    }

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      gymId,
      role,
    });

    // Efectos colaterales: QR de identidad siempre; membresía de prueba solo
    // para socios (el dueño no necesita una).
    await qrRepository.create(user.id, generateQRValue());
    if (createTrial) {
      await membershipRepository.create(user.id, DEFAULT_TRIAL_DAYS);
    }

    const token = signToken({
      sub: user.id,
      role: user.role as Role,
      gymId: user.gymId,
      email: user.email,
    });

    return { token, user: toPublicUser(user) };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Credenciales inválidas");
    const valid = await verifyPassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError("Credenciales inválidas");

    const token = signToken({
      sub: user.id,
      role: user.role as Role,
      gymId: user.gymId,
      email: user.email,
    });
    return { token, user: toPublicUser(user) };
  },

  /**
   * Alta administrativa: un admin crea un usuario nuevo dentro del mismo gym.
   *  - Puede elegir rol (admin | client).
   *  - Puede configurar los días de membresía (0 = sin membresía inicial).
   *  - No devuelve token: el admin no se loguea como el nuevo usuario.
   */
  async createUser(input: AdminCreateUserInput, adminGymId: string) {
    await ensureGymActive(adminGymId);
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("El email ya está registrado");

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      gymId: adminGymId,
      role: input.role,
    });

    await qrRepository.create(user.id, generateQRValue());
    if (input.membershipDays > 0) {
      await membershipRepository.create(user.id, input.membershipDays);
    }

    return toPublicUser(user);
  },

  /**
   * Cambio de contraseña para el usuario autenticado.
   * Valida que la contraseña actual sea correcta antes de hashear la nueva.
   */
  async changePassword(session: JwtPayload, input: ChangePasswordInput) {
    const user = await userRepository.findById(session.sub);
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const valid = await verifyPassword(input.currentPassword, user.password);
    if (!valid) throw new UnauthorizedError("La contraseña actual no es correcta");

    const newHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.id, newHash);
  },

  async me(session: JwtPayload) {
    const user = await userRepository.findByIdWithRelations(session.sub);
    if (!user) throw new NotFoundError("Usuario no encontrado");
    const latest = user.memberships[0];
    const qr = user.qrCodes[0];
    return {
      ...toPublicUser(user),
      gym: {
        id: user.gym.id,
        name: user.gym.name,
        slug: user.gym.slug,
        status: user.gym.status as "active" | "trial" | "suspended",
        trialEndsAt: user.gym.trialEndsAt
          ? user.gym.trialEndsAt.toISOString()
          : null,
      },
      membership: latest
        ? {
            status: latest.status,
            startDate: latest.startDate,
            endDate: latest.endDate,
            daysRemaining: daysRemaining(latest.endDate),
          }
        : null,
      qrCode: qr?.code ?? null,
    };
  },
};

export function toPublicUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  gymId: string;
  photoUrl: string | null;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    gymId: u.gymId,
    photoUrl: u.photoUrl,
  };
}

export function daysRemaining(endDate: Date): number {
  const ms = endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
