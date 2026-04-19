import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | null, locale: string = "en"): string {
  if (!date) return "\u2014";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | null, locale: string = "en"): string {
  if (!date) return "\u2014";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency: string = "EGP", locale: string = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
