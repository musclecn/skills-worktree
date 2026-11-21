"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getAlternateHref } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

/**
 * 页头语言切换：指向同一内容的另一语言版本，并保留列表筛选条件。
 * `overrideHref` 用于当前内容没有对应译文的页面，由服务端决定落点。
 */
export function LangSwitch({ locale, overrideHref }: { locale: AppLocale; overrideHref?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = overrideHref ?? getAlternateHref(locale, pathname ?? "/", searchParams);

  // 站内跳转不会重新渲染根布局，这里把 <html lang> 同步为当前页面的语言。
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
  }, [locale]);

  return (
    <Link
      className="lang-switch"
      href={href}
      hrefLang={locale === "zh" ? "en" : "zh-CN"}
      lang={locale === "zh" ? "en" : "zh-CN"}
      aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
      data-track="lang_switch"
    >
      {locale === "zh" ? "EN" : "中文"}
    </Link>
  );
}

export function LangSwitchFallback({ locale }: { locale: AppLocale }) {
  return (
    <Link className="lang-switch" href={locale === "zh" ? "/en" : "/"}>
      {locale === "zh" ? "EN" : "中文"}
    </Link>
  );
}
