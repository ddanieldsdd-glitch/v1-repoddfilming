import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Normaliza href tel: desde +34… o dígitos locales. */
export function telHref(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "#";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "#";
  return `tel:+${digits.startsWith("34") ? digits : `34${digits}`}`;
}

/** Presentación legible para móviles ES (+34 647 …). */
export function formatPhoneDisplay(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("34")) {
    const n = digits.slice(2);
    return `+34 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}
