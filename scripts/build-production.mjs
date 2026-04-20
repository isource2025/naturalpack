/**
 * Build usado en Vercel / Railway: generate → migrate deploy → next build.
 */
import { execSync, spawnSync } from "node:child_process";
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

/**
 * El proxy público de Railway (*.rlwy.net) suele exigir TLS explícito desde
 * clientes externos (Vercel). Sin ?sslmode=require, migrate deploy a veces
 * falla después de listar migraciones.
 */
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

function runMigrateDeploy() {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    shell: true,
    encoding: "utf8",
    env: process.env,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0 && r.status !== null) {
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ prisma migrate deploy falló (código ${r.status}).

Si usás Railway + Vercel:
  • La URL tiene que ser DATABASE_PUBLIC_URL (no *.railway.internal).
  • El script ya agrega ?sslmode=require para *.rlwy.net si faltaba.
  • En Vercel → Settings → General: Node.js 20.x (package.json tiene "engines").

Si el error menciona PgBouncer / prepared statements / pooler, en Railway
buscá una URL "directa" sin pooler para migraciones o consultá la doc de
Railway para tu tipo de Postgres.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    process.exit(r.status);
  }
}

loadDotEnv();
run("npx prisma generate");

let db = process.env.DATABASE_URL?.trim() ?? "";
if (!db.startsWith("postgresql://") && !db.startsWith("postgres://")) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DATABASE_URL no está definida o no es una URL de PostgreSQL.

En Vercel: pegá el valor de DATABASE_PUBLIC_URL de Railway en DATABASE_URL.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(1);
}

if (db.includes(".railway.internal") || db.includes("railway.internal")) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DATABASE_URL apunta a *.railway.internal — Vercel no puede usarla.

Usá DATABASE_PUBLIC_URL como valor de DATABASE_URL en Vercel.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(1);
}

db = normalizeDatabaseUrl(db);
process.env.DATABASE_URL = db;

runMigrateDeploy();
run("npx next build");
