import { prisma } from "../db";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  findByIdWithRelations(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        memberships: { orderBy: { endDate: "desc" }, take: 1 },
        qrCodes: { where: { active: true }, take: 1 },
        gym: true,
      },
    });
  },
  create(data: {
    name: string;
    email: string;
    password: string;
    gymId: string;
    role?: "admin" | "client";
  }) {
    return prisma.user.create({ data });
  },
  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  },
  setTrainingProfile(
    id: string,
    data: {
      trainingLevel: "novato" | "intermedio" | "avanzado";
      trainingGoal: "intensidad" | "fuerza" | "ganancia_musculo";
      trainingPlanKey: string;
      onboardingCompletedAt: Date;
    }
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
  /**
   * Lista usuarios del gym con su última membresía (si existe) para el panel
   * de administración. Ordenado por nombre. Opcionalmente filtra por rol.
   */
  listByGym(gymId: string, opts: { role?: "admin" | "client" } = {}) {
    return prisma.user.findMany({
      where: {
        gymId,
        ...(opts.role ? { role: opts.role } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        memberships: { orderBy: { endDate: "desc" }, take: 1 },
      },
    });
  },
};
