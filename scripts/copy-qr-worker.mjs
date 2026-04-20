// Copia el worker de qr-scanner a /public para que Next.js lo sirva en
// una ruta estable (/qr-scanner-worker.min.js). Evita problemas de bundling
// del `new URL('./worker', import.meta.url)` interno de la librería.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const sources = [
  "node_modules/qr-scanner/qr-scanner-worker.min.js",
  "node_modules/qr-scanner/qr-scanner-worker.min.js.map",
];

const publicDir = resolve(root, "public");
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

for (const rel of sources) {
  const src = resolve(root, rel);
  if (!existsSync(src)) continue;
  const file = rel.split("/").pop();
  if (!file) continue;
  copyFileSync(src, resolve(publicDir, file));
  console.log(`[copy-qr-worker] public/${file}`);
}
