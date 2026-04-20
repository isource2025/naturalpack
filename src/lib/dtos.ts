import { z } from "zod";

/**
 * Registro público — modo SaaS. Dos caminos:
 *  - "owner": creás un gimnasio nuevo y quedás como admin del mismo.
 *  - "client": te sumás a un gimnasio existente usando su código (slug).
 * La unión discriminada por `mode` hace que TS narre correctamente los
 * campos requeridos según el caso.
 */
const baseRegister = {
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
};

export const OwnerRegisterDTO = z.object({
  mode: z.literal("owner"),
  ...baseRegister,
  gymName: z
    .string()
    .trim()
    .min(2, "Nombre del gym muy corto")
    .max(80, "Máximo 80 caracteres"),
});
export type OwnerRegisterInput = z.infer<typeof OwnerRegisterDTO>;

export const ClientRegisterDTO = z.object({
  mode: z.literal("client"),
  ...baseRegister,
  gymSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Ingresá el código del gym")
    .max(80),
});
export type ClientRegisterInput = z.infer<typeof ClientRegisterDTO>;

export const RegisterDTO = z.discriminatedUnion("mode", [
  OwnerRegisterDTO,
  ClientRegisterDTO,
]);
export type RegisterInput = z.infer<typeof RegisterDTO>;

export const LoginDTO = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginDTO>;

export const ValidateAccessDTO = z.object({
  code: z.string().trim().min(4, "QR inválido"),
});
export type ValidateAccessInput = z.infer<typeof ValidateAccessDTO>;

export const CheckInDTO = z.object({
  token: z.string().trim().min(8, "Token de kiosk inválido"),
});
export type CheckInInput = z.infer<typeof CheckInDTO>;

export const KioskSessionDTO = z.object({
  gymId: z.string().trim().min(1).nullable().optional(),
});
export type KioskSessionInput = z.infer<typeof KioskSessionDTO>;

export const Roles = ["client", "admin", "superadmin"] as const;
export type Role = (typeof Roles)[number];

/** Roles que un admin puede asignar cuando crea un socio: nunca superadmin. */
export const AssignableRoles = ["client", "admin"] as const;
export type AssignableRole = (typeof AssignableRoles)[number];

/** Estados posibles para un Gym en la plataforma. */
export const GymStatuses = ["active", "trial", "suspended"] as const;
export type GymStatusT = (typeof GymStatuses)[number];

/** Métodos de pago de plataforma (gym → NaturalPack). */
export const PlatformPaymentMethods = [
  "cash",
  "transfer",
  "card",
  "mercadopago",
] as const;
export type PlatformPaymentMethod = (typeof PlatformPaymentMethods)[number];

export const GymCreateDTO = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  /** Si no pasás slug, se genera desde el nombre. */
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Solo letras, números y guiones")
    .optional(),
  status: z.enum(["active", "trial", "suspended"]).default("active"),
  trialEndsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type GymCreateInput = z.infer<typeof GymCreateDTO>;

export const GymStatusUpdateDTO = z.object({
  status: z.enum(GymStatuses),
  trialEndsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type GymStatusUpdateInput = z.infer<typeof GymStatusUpdateDTO>;

export const PlatformPaymentCreateDTO = z.object({
  amount: z.coerce.number().int().min(1).max(1_000_000_000),
  method: z.enum(PlatformPaymentMethods).default("transfer"),
  periodStart: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  periodEnd: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  note: z.string().trim().max(500).optional(),
});
export type PlatformPaymentCreateInput = z.infer<
  typeof PlatformPaymentCreateDTO
>;

export const ChangePasswordDTO = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z
      .string()
      .min(6, "Mínimo 6 caracteres")
      .max(100, "Máximo 100 caracteres"),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof ChangePasswordDTO>;

export const AdminCreateUserDTO = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
  role: z.enum(AssignableRoles).default("client"),
  membershipDays: z.coerce.number().int().min(0).max(3650).default(30),
});
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserDTO>;

export const MembershipStatus = ["active", "expired", "cancelled"] as const;
export type MembershipStatusT = (typeof MembershipStatus)[number];

export const AccessStatus = ["granted", "denied"] as const;
export type AccessStatusT = (typeof AccessStatus)[number];

// --- Pagos -----------------------------------------------------

export const PaymentMethods = ["cash", "transfer", "card"] as const;
export type PaymentMethod = (typeof PaymentMethods)[number];

export const PaymentCreateDTO = z.object({
  userId: z.string().trim().min(1),
  listAmount: z.coerce.number().int().min(1).max(100_000_000),
  days: z.coerce.number().int().min(1).max(3650),
  method: z.enum(PaymentMethods).default("cash"),
  discountCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(64)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  applyAuto: z.boolean().default(true),
  note: z.string().trim().max(500).optional(),
});
export type PaymentCreateInput = z.infer<typeof PaymentCreateDTO>;

// --- Descuentos ------------------------------------------------

export const DiscountKinds = ["auto", "code"] as const;
export type DiscountKind = (typeof DiscountKinds)[number];

export const DiscountCreateDTO = z
  .object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(DiscountKinds),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/i, "Solo letras, números, _ o -")
      .optional(),
    percentOff: z.coerce.number().int().min(1).max(100).optional(),
    amountOff: z.coerce.number().int().min(1).max(100_000_000).optional(),
    active: z.boolean().default(true),
    startsAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
    endsAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
    usageLimit: z.coerce.number().int().min(1).max(1_000_000).optional(),
  })
  .refine(
    (v) => v.percentOff || v.amountOff,
    { message: "Definí porcentaje o monto fijo", path: ["percentOff"] }
  )
  .refine(
    (v) => v.kind !== "code" || !!v.code,
    { message: "Los descuentos por código necesitan un code", path: ["code"] }
  );
export type DiscountCreateInput = z.infer<typeof DiscountCreateDTO>;

export const DiscountUpdateDTO = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/i, "Solo letras, números, _ o -")
    .optional()
    .or(z.literal("").transform(() => "")),
  percentOff: z.coerce.number().int().min(0).max(100).optional(),
  amountOff: z.coerce.number().int().min(0).max(100_000_000).optional(),
  active: z.boolean().optional(),
  startsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  endsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  usageLimit: z.coerce.number().int().min(0).max(1_000_000).optional(),
});
export type DiscountUpdateInput = z.infer<typeof DiscountUpdateDTO>;

export const DiscountActiveDTO = z.object({
  active: z.boolean(),
});
export type DiscountActiveInput = z.infer<typeof DiscountActiveDTO>;
