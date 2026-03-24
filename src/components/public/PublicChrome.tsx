import Link from "next/link";
import Image from "next/image";
import { getMenuData, getSiteData } from "@/lib/data";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

export async function PublicChrome({
  locale,
  children,
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  const [site, menus] = await Promise.all([getSiteData(locale), getMenuData(locale)]);
  const logoSrc = site?.logoUrl || "/brand/taxs-logo.svg";
  const logoAlt = locale === "zh" ? "泰可思公司 Logo" : "Taxs company logo";

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="logo" href={localizePath(locale, "/")}>
            <Image className="logo-image" src={logoSrc} alt={logoAlt} width={280} height={98} priority />
            <span className="sr-only">{site?.companyName ?? "泰可思"}</span>
          </Link>
          <nav className="nav">
            {menus.map((menu) => (
              <Link key={menu.id} href={localizePath(locale, menu.path)}>
                {menu.label}
              </Link>
            ))}
            <Link className="lang-switch" href={locale === "zh" ? "/en" : "/"}>
              {locale === "zh" ? "EN" : "中文"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p className="footer-title">{site?.companyName}</p>
          <p>{site?.address}</p>
          <p>{site?.phone}</p>
          <p>{site?.email}</p>
          <p>{site?.icpRecord}</p>
          <p>{site?.copyright}</p>
          {site?.footerBuilder ? <p>{site.footerBuilder}</p> : null}
        </div>
      </footer>
    </div>
  );
}
