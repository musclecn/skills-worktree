import type { AppLocale } from "@/lib/types";

export const DEFAULT_LOCALE: AppLocale = "zh";

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "zh";
}

export function pickLocalized<T extends Record<string, unknown>>(
  row: T,
  locale: AppLocale,
  zhKey: keyof T,
  enKey: keyof T,
) {
  const primary = row[locale === "en" ? enKey : zhKey];
  const fallback = row[locale === "en" ? zhKey : enKey];
  if (typeof primary === "string" && primary.trim().length > 0) {
    return primary;
  }
  if (typeof fallback === "string") {
    return fallback;
  }
  return "";
}

export function localizePath(locale: AppLocale, path: string) {
  if (locale === "zh") {
    return path;
  }
  if (path === "/") {
    return "/en";
  }
  return `/en${path}`;
}
