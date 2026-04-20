/**
 * Build usado en Vercel / Railway: generate → migrate deploy → next build.
 * Si falta DATABASE_URL, falla con un mensaje explícito (evita logs opacos).
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Carga .env local (Node no lo hace solo; Prisma CLI sí, pero este script no). */
function loadDotEnv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", shell: true });
}

loadDotEnv();
run("npx prisma generate");

const db = process.env.DATABASE_URL?.trim() ?? "";
if (!db.startsWith("postgresql://") && !db.startsWith("postgres://")) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DATABASE_URL no está definida o no es una URL de PostgreSQL.

Durante el build se ejecuta \`prisma migrate deploy\`, que necesita
conectar a la base (p. ej. la de Railway).

En Vercel: Project → Settings → Environment Variables
  • DATABASE_URL = (copiá la variable del servicio Postgres en Railway)
  • Aplicá a Production, Preview y Development según corresponda.

Borrá variables de ejemplo como EXAMPLE_NAME si no las usa la app.

Documentación: README.md → "Deploy a producción (Railway + Vercel)"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(1);
}

// Railway expone dos URLs: la interna (.railway.internal) solo sirve entre
// servicios dentro del mismo proyecto Railway. Vercel corre fuera de esa red.
if (db.includes(".railway.internal") || db.includes("railway.internal")) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DATABASE_URL apunta a la red privada de Railway (*.railway.internal).

Esa URL solo funciona si la app también corre en Railway. Vercel no puede
alcanzarla → \`prisma migrate deploy\` falla en el build.

Solución en Railway (servicio Postgres → Variables):
  • Usá el valor de DATABASE_PUBLIC_URL (host tipo *.proxy.rlwy.net y puerto
    público), O la "Public Network" / connection string externa.

En Vercel la variable debe seguir llamándose DATABASE_URL (así lo espera
Prisma), pero el VALOR tiene que ser la URL pública, no la interna.

Opcional: agregá ?sslmode=require al final si Railway lo documenta para tu plan.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(1);
}

run("npx prisma migrate deploy");
run("npx next build");
