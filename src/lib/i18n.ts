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

/** 只存在英文版的路径（去掉 /en 前缀后），切回中文时落到首页。 */
const EN_ONLY_PATHS = new Set(["/export-sales-reconciliation"]);

/** 语言切换时保留的查询参数及其允许值。 */
const KEPT_QUERY_VALUES: Record<string, Set<string>> = {
  category: new Set(["company", "industry"]),
};

function stripEnPrefix(pathname: string) {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/**
 * 计算当前页面在另一种语言下的地址，保留同一内容和列表筛选条件。
 * `currentLocale` 是当前页面的语言，返回值指向另一种语言。
 */
export function getAlternateHref(
  currentLocale: AppLocale,
  pathname: string,
  search?: string | URLSearchParams | null,
) {
  const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname || "/";
  const basePath = stripEnPrefix(cleanPath);
  const targetLocale: AppLocale = currentLocale === "zh" ? "en" : "zh";

  let targetPath: string;
  if (targetLocale === "zh") {
    targetPath = EN_ONLY_PATHS.has(basePath) ? "/" : basePath;
  } else {
    targetPath = localizePath("en", basePath);
  }

  const source = typeof search === "string" ? new URLSearchParams(search) : search;
  const kept = new URLSearchParams();
  if (source && targetPath !== "/" && targetPath !== "/en") {
    for (const [key, allowed] of Object.entries(KEPT_QUERY_VALUES)) {
      const value = source.get(key)?.trim().toLowerCase();
      if (value && allowed.has(value)) kept.set(key, value);
    }
    // 两种语言的新闻列表条目相同，页码可以直接沿用
    const page = source.get("page")?.trim() ?? "";
    if (/^\d{1,4}$/.test(page) && Number(page) > 1) kept.set("page", String(Number(page)));
  }

  const query = kept.toString();
  return query ? `${targetPath}?${query}` : targetPath;
}

/** 根据请求路径判断页面语言，用于 <html lang>。 */
export function localeFromPathname(pathname: string | null | undefined): AppLocale {
  if (!pathname) return DEFAULT_LOCALE;
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
}
