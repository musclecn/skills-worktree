import Link from "next/link";
import { headers } from "next/headers";
import { PublicChrome } from "@/components/public/PublicChrome";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

/**
 * 全站 404：地址不存在、新闻已下线或页码超出范围时显示。
 * 语言由 src/proxy.ts 写入的 x-site-locale 请求头判断（/en 开头为英文）。
 */
export default async function NotFound() {
  const locale: AppLocale = (await headers()).get("x-site-locale") === "en" ? "en" : "zh";
  const zh = locale === "zh";
  const links = [
    { href: "/", label: zh ? "返回首页" : "Home" },
    { href: "/news", label: zh ? "新闻动态" : "News" },
    { href: "/products", label: zh ? "产品中心" : "Products" },
    { href: "/contact", label: zh ? "联系我们" : "Contact Us" },
  ];

  return (
    <PublicChrome locale={locale}>
      <div className="container page-frame">
        <section className="page-lead not-found-lead">
          <p className="eyebrow">404</p>
          <h1>{zh ? "页面不存在" : "Page not found"}</h1>
          <p>
            {zh
              ? "您访问的页面可能已调整或下线。可以从下面的入口继续浏览，或直接联系我们。"
              : "The page you are looking for may have moved or been removed. Continue from one of the links below, or contact us."}
          </p>
          <nav className="not-found-links" aria-label={zh ? "常用入口" : "Popular pages"}>
            {links.map((item) => (
              <Link key={item.href} href={localizePath(locale, item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </PublicChrome>
  );
}
