import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { Role } from "./dtos";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
export const AUTH_COOKIE = "np_session";

export type JwtPayload = {
  sub: string; // userId
  role: Role;
  gymId: string;
  email: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload;
    return decoded;
  } catch {
    throw new UnauthorizedError("Sesión inválida o expirada");
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Lee la sesión desde la cookie. Lanza UnauthorizedError si no existe o es inválida. */
export function requireSession(): JwtPayload {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) throw new UnauthorizedError("No hay sesión activa");
  return verifyToken(token);
}

/**
 * Lee la sesión y exige rol admin del gym. El superadmin NO pasa este chequeo
 * porque no pertenece a ningún gym — para operaciones de gym usá requireAdmin,
 * para operaciones de plataforma usá requireSuperadmin.
 */
export function requireAdmin(): JwtPayload {
  const session = requireSession();
  if (session.role !== "admin") {
    throw new ForbiddenError("Se requiere rol admin");
  }
  return session;
}

/** Lee la sesión y exige rol superadmin (operador de la plataforma). */
export function requireSuperadmin(): JwtPayload {
  const session = requireSession();
  if (session.role !== "superadmin") {
    throw new ForbiddenError("Se requiere rol superadmin");
  }
  return session;
}

/** Devuelve la sesión o null si no hay. */
export function getSession(): JwtPayload | null {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
