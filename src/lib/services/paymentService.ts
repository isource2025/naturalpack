import { NotFoundError, ValidationError } from "../errors";
import { paymentRepository } from "../repositories/paymentRepository";
import { userRepository } from "../repositories/userRepository";
import { membershipRepository } from "../repositories/membershipRepository";
import { discountService, applyDiscount } from "./discountService";
import { ensureGymActive } from "./gymGuard";
import type { PaymentCreateInput } from "../dtos";

export type PaymentDTO = {
  id: string;
  amount: number;
  listAmount: number;
  discountAmount: number | null;
  days: number;
  method: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  admin: { id: string; name: string } | null;
  discount: { id: string; name: string; code: string | null; kind: string } | null;
};

export const paymentService = {
  /**
   * Registra un pago aceptado por el admin (efectivo u otros) y extiende
   * la membresía del socio en `days` días.
   *
   * Estrategia de descuento:
   *  - si `discountCode` viene, se resuelve por código.
   *  - si no, se aplica el mejor descuento automático vigente (si hay).
   *  - si `applyAuto === false` en el input, se saltea el auto.
   */
  async create(
    input: PaymentCreateInput,
    gymId: string,
    adminId: string
  ) {
    if (input.listAmount <= 0) {
      throw new ValidationError("El monto debe ser mayor a 0");
    }
    if (input.days <= 0) {
      throw new ValidationError("Los días deben ser mayores a 0");
    }

    await ensureGymActive(gymId);

    const customer = await userRepository.findById(input.userId);
    if (!customer || customer.gymId !== gymId) {
      throw new NotFoundError("El socio no existe o no pertenece a este gym");
    }

    // Resolución de descuento.
    let resolved = null as Awaited<
      ReturnType<typeof discountService.resolveByCode>
    >;
    if (input.discountCode) {
      resolved = await discountService.resolveByCode(gymId, input.discountCode);
      if (!resolved) {
        throw new ValidationError("El código de descuento no es válido o está inactivo");
      }
    } else if (input.applyAuto !== false) {
      resolved = await discountService.bestAutoFor(gymId, input.listAmount);
    }

    const { amount, discountAmount } = applyDiscount(input.listAmount, resolved);

    const payment = await paymentRepository.create({
      gymId,
      userId: input.userId,
      adminId,
      amount,
      listAmount: input.listAmount,
      currency: "ARS",
      method: input.method ?? "cash",
      days: input.days,
      discountId: resolved?.id ?? null,
      discountCode: resolved?.code ?? null,
      discountAmount: resolved ? discountAmount : null,
      note: input.note ?? null,
    });

    // Extendemos la membresía DESPUÉS de persistir el pago.
    await membershipRepository.addDays(input.userId, input.days);

    if (resolved) {
      await discountService.incrementUsage(resolved.id);
    }

    return payment;
  },

  async list(gymId: string, opts: { limit?: number; cursor?: string | null } = {}) {
    const rows = await paymentRepository.listByGym(gymId, opts);
    return rows.map(toDTO);
  },
};

function toDTO(p: {
  id: string;
  amount: number;
  listAmount: number;
  discountAmount: number | null;
  days: number;
  method: string;
  note: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  admin: { id: string; name: string } | null;
  discount: { id: string; name: string; code: string | null; kind: string } | null;
}): PaymentDTO {
  return {
    id: p.id,
    amount: p.amount,
    listAmount: p.listAmount,
    discountAmount: p.discountAmount,
    days: p.days,
    method: p.method,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
    user: p.user,
    admin: p.admin,
    discount: p.discount,
  };
}
