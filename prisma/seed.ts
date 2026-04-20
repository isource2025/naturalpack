import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function qrValue() {
  return `np_${crypto.randomBytes(24).toString("base64url")}`;
}

async function main() {
  console.log("🌱 Sembrando datos iniciales...");

  const gym = await prisma.gym.upsert({
    where: { slug: "default" },
    update: {},
    create: { slug: "default", name: "NaturalPack" },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@naturalpack.gym" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@naturalpack.gym",
      password: passwordHash,
      role: "admin",
      gymId: gym.id,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "socio@naturalpack.gym" },
    update: {},
    create: {
      name: "Juan Pérez",
      email: "socio@naturalpack.gym",
      password: passwordHash,
      role: "client",
      gymId: gym.id,
    },
  });

  // Asegurar un QR y una membresía activa para cada usuario.
  for (const u of [admin, client]) {
    const existingQr = await prisma.qRCode.findFirst({
      where: { userId: u.id, active: true },
    });
    if (!existingQr) {
      await prisma.qRCode.create({ data: { userId: u.id, code: qrValue() } });
    }
    const existingMembership = await prisma.membership.findFirst({ where: { userId: u.id } });
    if (!existingMembership) {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      await prisma.membership.create({
        data: { userId: u.id, status: "active", startDate: now, endDate: end },
      });
    }
  }

  const demoQr = await prisma.qRCode.findFirst({ where: { userId: client.id, active: true } });

  console.log("✅ Seed listo.");
  console.log("    Admin: admin@naturalpack.gym / password123");
  console.log("    Socio: socio@naturalpack.gym / password123");
  console.log(`    QR demo (socio): ${demoQr?.code ?? "(no generado)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
