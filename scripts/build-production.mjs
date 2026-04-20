/**
 * Build en Vercel / Railway: prisma generate → migrate deploy → next build.
 * Usa solo spawnSync + stdio inherit (nunca execSync) para que Vercel muestre
 * la salida real de Prisma/Next y no solo "Error: Command failed".
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log(
  `[naturalpack] build-production.mjs | node ${process.version} | pid ${process.pid}`
);

/** Carga .env local si existe (Vercel no tiene .env en el repo). */
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

function spawnInherit(label, command, args) {
  console.log(`[naturalpack] → ${label}: ${command} ${args.join(" ")}`);
  const r = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    cwd: process.cwd(),
  });
  if (r.error) {
    console.error(`[naturalpack] ${label} spawn error:`, r.error);
    process.exit(1);
  }
  if (r.signal) {
    console.error(`[naturalpack] ${label} killed by signal: ${r.signal}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Falló: ${label} (código de salida ${r.status})

Si fue prisma migrate deploy y usás Railway: DATABASE_URL = DATABASE_PUBLIC_URL
(no *.railway.internal). El script agrega sslmode=require en *.rlwy.net.

Forzá Node 20 en Vercel: Project → Settings → General → Node.js Version → 20.x
(este repo tiene engines + .npmrc engine-strict).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    process.exit(r.status ?? 1);
  }
}

/** TLS explícito para proxies públicos (Railway, Neon, etc.). */
function normalizeDatabaseUrl(url) {
  const u = url.trim();
  if (!u.startsWith("postgresql://") && !u.startsWith("postgres://")) return u;
  const needsSsl =
    /\.rlwy\.net/i.test(u) ||
    /railway\.app/i.test(u) ||
    /neon\.tech/i.test(u);
  if (!needsSsl) return u;
  if (/[?&]sslmode=/i.test(u)) return u;
  return u.includes("?") ? `${u}&sslmode=require` : `${u}?sslmode=require`;
}

loadDotEnv();
spawnInherit("prisma generate", "npx", ["prisma", "generate"]);

let db = process.env.DATABASE_URL?.trim() ?? "";
if (!db.startsWith("postgresql://") && !db.startsWith("postgres://")) {
  console.error(`
❌ DATABASE_URL debe ser postgresql://…
   En Vercel usá el valor de DATABASE_PUBLIC_URL (Railway).
`);
  process.exit(1);
}
if (db.includes(".railway.internal") || db.includes("railway.internal")) {
  console.error(`
❌ DATABASE_URL no puede ser *.railway.internal desde Vercel.
   Usá DATABASE_PUBLIC_URL como valor de DATABASE_URL.
`);
  process.exit(1);
}

db = normalizeDatabaseUrl(db);
process.env.DATABASE_URL = db;

spawnInherit("prisma migrate deploy", "npx", ["prisma", "migrate", "deploy"]);
spawnInherit("next build", "npx", ["next", "build"]);
