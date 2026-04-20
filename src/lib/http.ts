import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

/**
 * Envuelve un handler para manejar errores de forma centralizada.
 * Convierte ZodError y AppError en respuestas consistentes.
 */
export function handle<T extends (...args: any[]) => Promise<Response>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(400, "VALIDATION_ERROR", "Datos inválidos", err.flatten());
      }
      if (err instanceof AppError) {
        return fail(err.status, err.code, err.message, err.details);
      }
      console.error("[API] Unhandled error:", err);
      return fail(500, "INTERNAL_ERROR", "Error interno del servidor");
    }
  }) as T;
}
