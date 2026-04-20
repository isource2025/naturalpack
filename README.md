# NaturalPack — SaaS de Membresías con Control de Acceso por QR

MVP full-stack para gestión de membresías de gimnasio con control de acceso por QR **dinámico en la pantalla del gym**: el kiosk muestra un QR rotativo, el socio lo escanea desde su app y la pantalla confirma la entrada en tiempo real.

Incluye:

- **Módulo 1**: auth, membresía, logs de acceso y lógica de validación por QR.
- **Módulo 2**: Kiosk fullscreen con QR rotativo + feedback en tiempo real vía SSE (+ polling de respaldo).

---

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript estricto
- **ORM**: Prisma
- **DB**: PostgreSQL (Railway en prod, Postgres local en dev)
- **Auth**: JWT firmado con `jsonwebtoken` + cookie `HttpOnly`, hashing con `bcryptjs`
- **Validación**: Zod (DTOs)
- **Tiempo real**: Server-Sent Events (SSE) + polling como fallback
- **QR**: librería `qrcode` (valor único guardado en DB, imagen generada on-the-fly)

## Arquitectura

Separación por capas dentro de un único proyecto Next.js (simple para el MVP, preparado para escalar):

```
src/
├── app/
│   ├── api/              # Route handlers (controllers)
│   │   ├── auth/         # register, login, logout, me
│   │   ├── access/       # validate, last
│   │   └── kiosk/stream  # SSE
│   ├── (auth)/           # /login, /register
│   ├── dashboard/        # Panel del socio (QR + membresía)
│   └── kiosk/            # Pantalla fullscreen de control de acceso
├── lib/
│   ├── db.ts             # Prisma client singleton
│   ├── auth.ts           # JWT + hashing + requireSession
│   ├── dtos.ts           # Zod schemas
│   ├── errors.ts         # AppError, ValidationError, ...
│   ├── http.ts           # handle() + ok()/fail() respuestas consistentes
│   ├── qr.ts             # Generación de valor y data-URL del QR
│   ├── events/bus.ts     # EventEmitter + pub/sub para SSE
│   ├── repositories/     # Acceso a datos (Prisma)
│   └── services/         # Lógica de dominio (authService, accessService)
├── middleware.ts         # Redirige /dashboard → /login si no hay cookie
└── prisma/schema.prisma
```

El bus de eventos es in-memory por simplicidad. Para escalar a múltiples instancias de kiosks/servers, reemplazar `bus.ts` por Redis pub/sub sin tocar los consumidores.

---

## Puesta en marcha (local)

Requisitos: Node.js 18+ y un PostgreSQL accesible (Docker, Postgres local, o la
misma DB de Railway si ya tenés una creada).

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar env y apuntar DATABASE_URL a tu Postgres
copy .env.example .env   # en Windows
# cp .env.example .env   # en Mac/Linux

# 3. Aplicar migraciones (crea las tablas)
npx prisma migrate deploy

# 4. (Opcional) Seed inicial + superadmin
npm run db:seed
npm run create-superadmin -- --email super@naturalpack.app --password Cambiame123!

# 5. Arrancar
npm run dev
```

Abre <http://localhost:3000>.

### Opción rápida: Postgres con Docker

```bash
docker run -d --name np-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=naturalpack postgres:16
```

Y poné en `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/naturalpack"
```

### HTTPS local (para la cámara desde el teléfono)

`getUserMedia` requiere contexto seguro. En `localhost` funciona, pero si abrís
`/scan` desde otro dispositivo en la LAN (`http://192.168.x.x:3000`), Chrome/Safari
bloquean la cámara. Dos opciones:

- **Sin HTTPS** (la más simple): escanea el QR del kiosk con la **cámara nativa** del teléfono.
  El QR contiene una URL `/scan?token=...`; al abrirla, la app hace el check-in automático sin
  tocar la cámara del navegador.

- **Con HTTPS local** (permite cámara in-browser):

  ```bash
  npm run dev:https
  ```

  Next genera certificados self-signed. Abre `https://localhost:3001/kiosk` en el PC y
  `https://192.168.x.x:3001/scan` en el teléfono (tendrás que aceptar el warning del cert
  una vez por dispositivo).

### Usuarios sembrados

| Rol   | Email                          | Contraseña   |
| ----- | ------------------------------ | ------------ |
| Admin | `admin@naturalpack.gym`        | `password123` |
| Socio | `socio@naturalpack.gym`        | `password123` |

El seed imprime en consola el código QR del socio de prueba (úsalo en `/api/access/validate`).

---

## Flujo end-to-end (nuevo)

1. Abrir `/register` y crear cuenta → sesión automática (cookie HttpOnly).
2. Abrir `/kiosk` en una pantalla montada en la entrada (no requiere login). La pantalla:
   - Solicita una sesión de kiosk (`POST /api/kiosk/session`).
   - Pide un token (`GET /api/kiosk/token`) con TTL de **24 h** y muestra el QR correspondiente.
   - El mismo QR es válido todo el día y puede ser escaneado por múltiples socios.
   - Antes de expirar se renueva automáticamente (1 min de margen).
   - Se suscribe a SSE filtrado por su `sessionId`.
3. El socio abre `/scan` (requiere login), la cámara lee el QR y llama a `POST /api/access/check-in { token }`.
4. El servidor consume el token (single-use), valida la membresía, registra `AccessLog` y emite un evento `access:result` dirigido al `kioskSessionId`.
5. La pantalla `/kiosk` se pone en verde con el nombre del socio y, tras 5 s, vuelve al QR rotativo.

### Probar sin teléfono (dos pestañas)

1. Pestaña A: abre http://localhost:3000/kiosk — verás el QR rotando.
2. Haz click derecho sobre el QR → **Copiar dirección de la imagen** no sirve; en su lugar, abre DevTools → Console en esa pestaña y ejecuta:

   ```js
   window.__debugToken = new URL(document.querySelector("img[alt='QR de acceso']").src); // no funciona
   ```

   Más fácil: el QR contiene una URL `http://localhost:3000/scan?token=kq_...`. Léela con cualquier lector de QR online, o simplemente cópiala desde la Console ejecutando:

   ```js
   // En la pestaña del kiosk, tras aparecer el QR:
   performance.getEntriesByType("resource").filter(r => r.name.includes("/api/kiosk/token"));
   ```

   Alternativa rápida: en la pestaña B (logueado), abre `/scan` con la URL de un token reciente (ver "Probar con curl" abajo).

### Probar con curl

Crear una sesión de kiosk y pedir un token:

```bash
SESSION=$(curl -s -X POST http://localhost:3000/api/kiosk/session -H "Content-Type: application/json" -d '{}' | jq -r .data.sessionId)
TOKEN=$(curl -s "http://localhost:3000/api/kiosk/token?sessionId=$SESSION" | jq -r .data.token)
```

Loguearse y ejecutar un check-in:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"socio@naturalpack.gym","password":"password123"}'

curl -b cookies.txt -X POST http://localhost:3000/api/access/check-in \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}"
```

La pantalla suscrita al SSE con ese `sessionId` recibirá el evento en el mismo instante.

---

## Endpoints

Todas las respuestas siguen el formato `{ ok: true, data } | { ok: false, error: { code, message, details? } }`.

### Auth

| Método | Ruta                  | Descripción                              | Auth |
| ------ | --------------------- | ---------------------------------------- | ---- |
| POST   | `/api/auth/register`  | Crea usuario + QR + membresía + sesión   | —    |
| POST   | `/api/auth/login`     | Login; setea cookie `np_session`         | —    |
| POST   | `/api/auth/logout`    | Limpia la cookie                         | cookie |
| GET    | `/api/auth/me`        | Datos del usuario + QR (dataUrl)         | cookie |

Body `register`:

```json
{ "name": "Juan", "email": "j@x.com", "password": "secret123", "gymSlug": "default" }
```

### Access (flujo nuevo)

| Método | Ruta                    | Descripción                                                       | Auth                    |
| ------ | ----------------------- | ----------------------------------------------------------------- | ----------------------- |
| POST   | `/api/access/check-in`  | Consume token del kiosk, valida membresía, loguea y emite evento  | Cookie de socio          |
| POST   | `/api/access/validate`  | **Legacy**: validar QR personal del socio (lector físico)         | `Bearer <READER_TOKEN>`  |
| GET    | `/api/access/last`      | Último resultado conocido (polling fallback)                      | —                        |

Body `check-in`:

```json
{ "token": "kq_..." }
```

Respuesta (payload UI-ready, es también el formato del evento SSE):

```json
{
  "status": "granted",
  "user": { "name": "Juan Pérez", "photoUrl": null },
  "membership": { "daysRemaining": 29 },
  "message": "Acceso permitido",
  "gymId": "clxxxxx",
  "kioskSessionId": "ks_xxxxxxxxxx",
  "timestamp": "2026-04-17T23:59:00.000Z"
}
```

### Kiosk (tiempo real)

| Método | Ruta                                   | Descripción                                          | Auth |
| ------ | -------------------------------------- | ---------------------------------------------------- | ---- |
| POST   | `/api/kiosk/session`                   | Crea una sesión de kiosk. Body: `{ gymId?: string }` | —    |
| GET    | `/api/kiosk/token?sessionId=...`       | Emite un token single-use (TTL 30s)                  | —    |
| GET    | `/api/kiosk/stream?sessionId=...`      | Canal SSE filtrado. Eventos: `ready`, `access:result`| —    |
| GET    | `/api/kiosk/stream?gymId=...`          | Canal SSE legacy (broadcast por gimnasio)            | —    |

Ejemplo consumidor desde el navegador (idéntico a WebSockets para este caso de uso):

```js
const es = new EventSource("/api/kiosk/stream?sessionId=ks_xxx");
es.addEventListener("ready", () => console.log("conectado"));
es.addEventListener("access:result", (e) => console.log(JSON.parse(e.data)));
```

---

## Variables de entorno

Ver `.env.example`. Para desarrollo local, `.env` ya trae valores por defecto.

| Variable              | Propósito                                                |
| --------------------- | -------------------------------------------------------- |
| `DATABASE_URL`        | Cadena de conexión Postgres (local o Railway)            |
| `JWT_SECRET`          | Secreto para firmar los JWT                              |
| `JWT_EXPIRES_IN`      | Duración del token (por defecto `7d`)                    |
| `ACCESS_READER_TOKEN` | Bearer que debe enviar el lector físico a `/access/validate` |
| `PUBLIC_BASE_URL`     | Host que el QR del kiosk embebe (override). Si no se define, se autodetecta la IP LAN |
| `NEXT_PUBLIC_APP_NAME`| Nombre mostrado en la UI                                 |

---

## Deploy a producción (Railway + Vercel)

La arquitectura recomendada es: **DB en Railway** (Postgres) + **app en Vercel**
(Next.js). Railway también puede correr la app si preferís un solo proveedor,
pero Vercel aprovecha mejor el edge/SSR.

### 1) Base de datos en Railway

1. Entrá a <https://railway.app> → **New Project** → **Provision PostgreSQL**.
2. Abrí el servicio Postgres → tab **Variables** y copiá `DATABASE_URL`
   (la que empieza con `postgresql://...`). Esa es la que vas a usar en
   Vercel y localmente si querés apuntar a la DB de prod.
3. (Opcional pero recomendado) Creá una segunda base en Railway para staging.

> Plan gratuito de Railway da ~$5 de crédito/mes, suficiente para empezar.
> Cuando lo consumas, tenés que pasar al plan Hobby (USD 5/mes).

### 2) Aplicar schema y crear superadmin

Desde tu máquina, apuntando la DB de Railway:

```bash
# En .env local (temporal) poné la DATABASE_URL de Railway
npx prisma migrate deploy          # crea todas las tablas
npm run create-superadmin -- \
  --email super@tu-dominio.com \
  --password "ContraseñaSegura123!"
```

Eso crea el gym técnico `platform` y el usuario `superadmin` que usarás para
gestionar los gyms desde `/platform` una vez desplegado.

### 3) App en Vercel

1. Andá a <https://vercel.com> → **Add New** → **Project** → importá
   `github.com/isource2025/naturalpack`.
2. Framework: **Next.js** (lo detecta solo).
3. Configurá las variables de entorno (tab **Environment Variables**):

   | Nombre                  | Valor                                                   |
   | ----------------------- | ------------------------------------------------------- |
   | `DATABASE_URL`          | la de Railway (el connection string completo)           |
   | `JWT_SECRET`            | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `JWT_EXPIRES_IN`        | `7d`                                                    |
   | `ACCESS_READER_TOKEN`   | un token random para el hardware reader                 |
   | `NEXT_PUBLIC_APP_NAME`  | `NaturalPack` (o el nombre que quieras mostrar)         |
   | `PUBLIC_BASE_URL`       | la URL pública de Vercel, ej. `https://naturalpack.vercel.app` |

4. Dale **Deploy**. El script `build` ya corre
   `prisma generate && prisma migrate deploy && next build`, así que si
   cambia el schema y pusheás, las migraciones se aplican solas en el próximo
   deploy.
5. Una vez arriba, entrá a `/login` con el superadmin y desde `/platform`
   creás el primer gym (o que el dueño se registre en `/register?as=owner`).

### Troubleshooting

- **`Error: P1001 Can't reach database server`** en el build de Vercel → la
  `DATABASE_URL` está mal o Railway bloqueó conexiones por IP. Chequeá que
  esté exactamente como la da Railway (incluye `?sslmode=require` si es plan
  dedicado).
- **Schema cambió pero Vercel no corre migrations** → verificá que `build` en
  `package.json` incluya `prisma migrate deploy`. Redeploya desde Vercel.
- **Cambiaste el schema localmente y no tenés migration** → correr
  `npx prisma migrate dev --name <descripcion>` localmente con DATABASE_URL
  apuntando a una DB de dev, commit de la carpeta `prisma/migrations/` y
  push. Vercel aplicará la migration en el próximo deploy.

### Deploy alternativo (todo en Railway)

Si preferís Railway solo:

1. En tu proyecto de Railway, **New → Deploy from GitHub Repo** → elegí este repo.
2. Seteá las mismas env vars que Vercel.
3. El `build` ya corre `migrate deploy` y `start` usa `$PORT` (Railway lo inyecta).

---

## Buenas prácticas aplicadas

- **Clean Architecture (ligera)**: controllers (`app/api/.../route.ts`) → services → repositories → Prisma.
- **DTOs con Zod** y validación en el borde (controllers).
- **Manejo centralizado de errores** vía `handle()` en `lib/http.ts`, convirtiendo `AppError` y `ZodError` en respuestas consistentes.
- **JWT en cookie HttpOnly** (no accesible a JS del cliente). El middleware edge solo valida presencia; la verificación real (firma) ocurre en los handlers Node.
- **TypeScript estricto** con `noUncheckedIndexedAccess`.
- **Event bus desacoplado**: el `accessService` no sabe que existe un kiosk; solo publica `access:result`. Cualquier consumidor (SSE, Redis, webhook...) puede suscribirse.

## Extras incluidos

- Polling endpoint `/api/access/last` como fallback si SSE falla (proxies, corporativas, etc.).
- Reset automático del kiosk a idle tras 5 s.
- Heartbeat SSE cada 15 s para mantener el canal abierto.
- Dataset de seed con admin + socio + QR listo para probar.

## Próximos pasos sugeridos

- Panel admin con listado de accesos (`AccessLog`) y gestión manual de membresías.
- Sistema de “racha” de asistencia (streaks) a partir de `AccessLog`.
- Multi-tenant completo: scope por `gymId` en todos los repositorios + subdominios.
- Mover el bus a Redis para escalar horizontalmente.
- Subida de foto de perfil (ya soportada en el schema vía `photoUrl`).
