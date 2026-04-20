import QRCode from "qrcode";
import crypto from "node:crypto";

/** Genera un valor único para el QR del usuario. No es adivinable. */
export function generateQRValue(): string {
  return `np_${crypto.randomBytes(24).toString("base64url")}`;
}

/** Convierte un valor de QR en data URL (base64 PNG) para renderizar en el frontend. */
export async function qrToDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}
