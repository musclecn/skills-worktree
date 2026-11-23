import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LangSwitch, LangSwitchFallback } from "@/components/public/LangSwitch";
import { SiteAnalytics } from "@/components/public/SiteAnalytics";
import { getMenuData, getSiteData } from "@/lib/data";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

export async function PublicChrome({
  locale,
  children,
  langSwitchHref,
}: {
  locale: AppLocale;
  children: React.ReactNode;
  /** 保留给法务页调用方；语言切换现在统一按当前路径计算。 */
  legalPage?: "/privacy" | "/terms";
  /** 当前内容没有对应译文时，由页面指定语言切换的落点。 */
  langSwitchHref?: string;
}) {
  const [site, menus] = await Promise.all([getSiteData(locale), getMenuData(locale)]);
  const logoSrc = site?.logoUrl || "/brand/taxs-logo.svg";
  const logoAlt = locale === "zh" ? "泰可思公司 Logo" : "Taxs company logo";
  const aiAgentMenu = {
    id: "fallback-ai-agent",
    key: "ai-agent",
    label: locale === "zh" ? "AI财税智能体" : "AI Tax Agent",
    path: "/ai-agent",
  };
  const aigcMenu = {
    id: "fallback-aigc",
    key: "aigc",
    label: "AIGC",
    path: "/aigc",
  };
  const openPlatformMenu = {
    id: "fallback-open-platform",
    key: "open-platform",
    label: locale === "zh" ? "开放平台" : "Open Platform",
    path: "/open-platform",
  };
  const shortVideosMenu = {
    id: "fallback-short-videos",
    key: "short-videos",
    label: locale === "zh" ? "视频介绍" : "Video Introduction",
    path: "/short-videos",
  };
  let normalizedMenus = [...menus];
  if (!normalizedMenus.some((menu) => menu.path === "/ai-agent" || menu.key === "ai-agent")) {
    const insertIndex = normalizedMenus.findIndex((menu) => menu.path === "/solutions");
    normalizedMenus =
      insertIndex === -1
        ? [...normalizedMenus, aiAgentMenu]
        : [...normalizedMenus.slice(0, insertIndex), aiAgentMenu, ...normalizedMenus.slice(insertIndex)];
  }
  if (!normalizedMenus.some((menu) => menu.path === "/aigc" || menu.key === "aigc")) {
    const aiAgentIndex = normalizedMenus.findIndex((menu) => menu.path === "/ai-agent" || menu.key === "ai-agent");
    normalizedMenus =
      aiAgentIndex === -1
        ? [...normalizedMenus, aigcMenu]
        : [...normalizedMenus.slice(0, aiAgentIndex + 1), aigcMenu, ...normalizedMenus.slice(aiAgentIndex + 1)];
  }
  if (!normalizedMenus.some((menu) => menu.path === "/open-platform" || menu.key === "open-platform")) {
    const insertIndex = normalizedMenus.findIndex((menu) => menu.path === "/short-videos" || menu.key === "short-videos");
    const fallbackIndex = normalizedMenus.findIndex((menu) => menu.path === "/solutions");
    const targetIndex = insertIndex === -1 ? fallbackIndex : insertIndex;
    normalizedMenus =
      targetIndex === -1
        ? [...normalizedMenus, openPlatformMenu]
        : [...normalizedMenus.slice(0, targetIndex), openPlatformMenu, ...normalizedMenus.slice(targetIndex)];
  }
  if (!normalizedMenus.some((menu) => menu.path === "/short-videos" || menu.key === "short-videos")) {
    const insertIndex = normalizedMenus.findIndex((menu) => menu.path === "/solutions");
    normalizedMenus =
      insertIndex === -1
        ? [...normalizedMenus, shortVideosMenu]
        : [...normalizedMenus.slice(0, insertIndex), shortVideosMenu, ...normalizedMenus.slice(insertIndex)];
  }

  return (
    <div className="app-shell">
      {/* 键盘和读屏用户可跳过页头导航，直接到正文 */}
      <a className="skip-link" href="#main-content">
        {locale === "zh" ? "跳到正文" : "Skip to main content"}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="logo" href={localizePath(locale, "/")}>
            <Image className="logo-image" src={logoSrc} alt={logoAlt} width={280} height={98} priority />
            <span className="sr-only">{site?.companyName ?? "泰可思"}</span>
          </Link>
          <nav className="nav" aria-label={locale === "zh" ? "主导航" : "Main navigation"}>
            {normalizedMenus.map((menu) => (
              <Link key={menu.id} href={localizePath(locale, menu.path)}>
                {menu.label}
              </Link>
            ))}
          </nav>
          {/* 预约与语言切换独立成一组：手机端放在 Logo 同一行，导航单独一行横向滑动 */}
          <div className="header-actions">
            <Link
              className="nav-cta"
              href={`${localizePath(locale, "/contact")}#appointment-form`}
              data-track="cta_click"
              data-track-id="header-demo"
            >
              {locale === "zh" ? "预约演示" : "Book a Demo"}
            </Link>
            <Suspense fallback={<LangSwitchFallback locale={locale} />}>
              <LangSwitch locale={locale} overrideHref={langSwitchHref} />
            </Suspense>
          </div>
        </div>
      </header>

      <SiteAnalytics />

      <main className="site-main" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p className="footer-title">{site?.companyName}</p>
          <p>{site?.address}</p>
          <p>{site?.phone}</p>
          <p>{site?.email}</p>
          <p>{site?.icpRecord}</p>
          <p>{site?.copyright}</p>
          {site?.footerBuilder ? <p>{site.footerBuilder}</p> : null}
          <p className="footer-links">
            <Link href="/en/export-sales-reconciliation">Export Sales Reconciliation</Link>
            <Link href={localizePath(locale, "/privacy")}>{locale === "zh" ? "隐私政策" : "Privacy Policy"}</Link>
            <Link href={localizePath(locale, "/terms")}>{locale === "zh" ? "服务条款" : "Terms of Service"}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
