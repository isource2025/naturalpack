import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { discountRepository } from "../repositories/discountRepository";
import type {
  DiscountCreateInput,
  DiscountUpdateInput,
} from "../dtos";

export type DiscountDTO = {
  id: string;
  name: string;
  kind: "auto" | "code";
  code: string | null;
  percentOff: number | null;
  amountOff: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
};

export type ApplicableDiscount = {
  id: string;
  name: string;
  kind: "auto" | "code";
  code: string | null;
  percentOff: number | null;
  amountOff: number | null;
};

function toDTO(d: {
  id: string;
  name: string;
  kind: string;
  code: string | null;
  percentOff: number | null;
  amountOff: number | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: Date;
  createdBy?: { id: string; name: string } | null;
}): DiscountDTO {
  return {
    id: d.id,
    name: d.name,
    kind: d.kind as "auto" | "code",
    code: d.code,
    percentOff: d.percentOff,
    amountOff: d.amountOff,
    active: d.active,
    startsAt: d.startsAt ? d.startsAt.toISOString() : null,
    endsAt: d.endsAt ? d.endsAt.toISOString() : null,
    usageLimit: d.usageLimit,
    usageCount: d.usageCount,
    createdAt: d.createdAt.toISOString(),
    createdBy: d.createdBy ?? null,
  };
}

function isActiveNow(d: {
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
}, now: Date = new Date()) {
  if (!d.active) return false;
  if (d.startsAt && d.startsAt > now) return false;
  if (d.endsAt && d.endsAt < now) return false;
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) return false;
  return true;
}

/** Calcula el total con un descuento aplicado. */
export function applyDiscount(
  listAmount: number,
  discount: Pick<ApplicableDiscount, "percentOff" | "amountOff"> | null
): { amount: number; discountAmount: number } {
  if (!discount) return { amount: listAmount, discountAmount: 0 };
  let off = 0;
  if (discount.percentOff) {
    off = Math.round((listAmount * discount.percentOff) / 100);
  } else if (discount.amountOff) {
    off = discount.amountOff;
  }
  off = Math.min(off, listAmount);
  return { amount: Math.max(0, listAmount - off), discountAmount: off };
}

export const discountService = {
  async create(input: DiscountCreateInput, gymId: string, adminId: string) {
    if (input.kind === "code" && !input.code) {
      throw new ValidationError("Los descuentos por código requieren un código");
    }
    if (!input.percentOff && !input.amountOff) {
      throw new ValidationError(
        "Debe definirse porcentaje o monto fijo de descuento"
      );
    }
    if (input.code) {
      const existing = await discountRepository.findByGymAndCode(
        gymId,
        input.code
      );
      if (existing) throw new ConflictError("Ya existe un descuento con ese código");
    }

    const created = await discountRepository.create({
      gymId,
      name: input.name,
      kind: input.kind,
      code: input.code ?? null,
      percentOff: input.percentOff ?? null,
      amountOff: input.amountOff ?? null,
      active: input.active ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      usageLimit: input.usageLimit ?? null,
      createdByAdminId: adminId,
    });
    return toDTO(created);
  },

  async update(id: string, input: DiscountUpdateInput, gymId: string) {
    const existing = await discountRepository.findById(id);
    if (!existing || existing.gymId !== gymId) {
      throw new NotFoundError("Descuento no encontrado");
    }
    if (
      input.code &&
      input.code !== existing.code
    ) {
      const dup = await discountRepository.findByGymAndCode(gymId, input.code);
      if (dup && dup.id !== id) {
        throw new ConflictError("Ya existe otro descuento con ese código");
      }
    }
    const updated = await discountRepository.update(id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code || null }),
      ...(input.percentOff !== undefined && { percentOff: input.percentOff }),
      ...(input.amountOff !== undefined && { amountOff: input.amountOff }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.startsAt !== undefined && {
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
      }),
      ...(input.endsAt !== undefined && {
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      }),
      ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
    });
    return toDTO(updated);
  },

  async setActive(id: string, active: boolean, gymId: string) {
    const existing = await discountRepository.findById(id);
    if (!existing || existing.gymId !== gymId) {
      throw new NotFoundError("Descuento no encontrado");
    }
    const updated = await discountRepository.update(id, { active });
    return toDTO(updated);
  },

  async delete(id: string, gymId: string) {
    const existing = await discountRepository.findById(id);
    if (!existing || existing.gymId !== gymId) {
      throw new NotFoundError("Descuento no encontrado");
    }
    await discountRepository.delete(id);
  },

  async list(gymId: string) {
    const rows = await discountRepository.listByGym(gymId);
    return rows.map(toDTO);
  },

  /** Resuelve por código (usado al registrar un pago). */
  async resolveByCode(
    gymId: string,
    code: string
  ): Promise<ApplicableDiscount | null> {
    const d = await discountRepository.findByGymAndCode(gymId, code);
    if (!d) return null;
    if (d.kind !== "code") return null; // los "auto" no se aplican por código
    if (!isActiveNow(d)) return null;
    return {
      id: d.id,
      name: d.name,
      kind: "code",
      code: d.code,
      percentOff: d.percentOff,
      amountOff: d.amountOff,
    };
  },

  /** Descuento automático mejor (mayor ahorro) para un monto dado, o null. */
  async bestAutoFor(
    gymId: string,
    listAmount: number
  ): Promise<ApplicableDiscount | null> {
    const rows = await discountRepository.listAutoActive(gymId);
    let best: { d: (typeof rows)[number]; saving: number } | null = null;
    for (const d of rows) {
      if (!isActiveNow(d)) continue;
      const { discountAmount } = applyDiscount(listAmount, d);
      if (!best || discountAmount > best.saving) {
        best = { d, saving: discountAmount };
      }
    }
    if (!best || best.saving <= 0) return null;
    return {
      id: best.d.id,
      name: best.d.name,
      kind: "auto",
      code: null,
      percentOff: best.d.percentOff,
      amountOff: best.d.amountOff,
    };
  },

  async findById(id: string, gymId: string) {
    const d = await discountRepository.findById(id);
    if (!d || d.gymId !== gymId) return null;
    return d;
  },

  async incrementUsage(id: string) {
    await discountRepository.incrementUsage(id);
  },
};
