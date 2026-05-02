import { ForbiddenError, NotFoundError } from "../errors";
import { gymRepository } from "../repositories/gymRepository";

/**
 * Corta las operaciones de escritura cuando el gym no está activo.
 * - "active": todo permitido.
 * - "trial": se permite operar normalmente (UI puede mostrar aviso).
 * - "suspended": bloqueamos altas/pagos. El admin sigue pudiendo leer.
 *
 * Pensado para usarse desde services (authService.createUser,
 * paymentService.create, etc.) antes de persistir cambios.
 */
export async function ensureGymActive(gymId: string): Promise<void> {
  const gym = await gymRepository.findById(gymId);
  if (!gym) throw new NotFoundError("Gimnasio no encontrado");
  if (gym.status === "suspended") {
    throw new ForbiddenError(
      "Este gimnasio está suspendido en la plataforma. Contacta al soporte de NaturalPack para reactivarlo."
    );
  }
}
