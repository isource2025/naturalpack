/**
 * Bootstrap de un superadmin (operador de plataforma).
 *
 * Uso:
 *   npm run create-superadmin -- --email you@mail.com --password secret --name "Tu Nombre"
 *
 * Si no pasas argumentos, intenta leer de variables de entorno:
 *   SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
 *
 * Crea (si no existen):
 *  - Un Gym técnico "NaturalPack Platform" con slug "platform", status "active".
 *  - Un User con role "superadmin" perteneciente a ese gym.
 *
 * Si el email ya existe lo "promueve" a superadmin (actualiza role).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLATFORM_GYM_SLUG = "platform";
const PLATFORM_GYM_NAME = "NaturalPack Platform";

function parseArgs(): { email?: string; password?: string; name?: string } {
  const out: { email?: string; password?: string; name?: string } = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--email" && next) out.email = next;
    else if (arg === "--password" && next) out.password = next;
    else if (arg === "--name" && next) out.name = next;
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const email = (args.email || process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
  const password = (args.password || process.env.SUPERADMIN_PASSWORD || "").trim();
  const name = (args.name || process.env.SUPERADMIN_NAME || "Superadmin").trim();

  if (!email) throw new Error("Falta email: pasalo con --email o SUPERADMIN_EMAIL");
  if (!password || password.length < 6) {
    throw new Error("Falta password con >=6 caracteres (--password / SUPERADMIN_PASSWORD)");
  }

  const gym = await prisma.gym.upsert({
    where: { slug: PLATFORM_GYM_SLUG },
    update: {},
    create: {
      slug: PLATFORM_GYM_SLUG,
      name: PLATFORM_GYM_NAME,
      status: "active",
    },
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "superadmin",
        password: passwordHash,
        gymId: gym.id,
        name,
      },
    });
    console.log(`\n✔ Usuario existente promovido a superadmin: ${updated.email}`);
    console.log(`  id: ${updated.id}`);
    console.log(`  gym: ${PLATFORM_GYM_SLUG}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: "superadmin",
      gymId: gym.id,
    },
  });

  console.log(`\n✔ Superadmin creado: ${user.email}`);
  console.log(`  id: ${user.id}`);
  console.log(`  gym técnico: ${PLATFORM_GYM_SLUG}`);
  console.log(`  ahora puedes iniciar sesión en /login y entrar a /platform.`);
}

main()
  .catch((err) => {
    console.error("\n✖ Error:", err.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
