import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "泰可思数据科技 | Taxs Digital Tax Platform",
  description: "泰可思新官网系统，支持前后台栏目与内容配置",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await headers()).get("x-site-locale") === "en" ? "en" : "zh-CN";

  return (
    <html lang={locale}>
      <body>
        {/* 首屏英文标题用到的拉丁字体，提前加载以减少字体切换闪烁 */}
        <link
          rel="preload"
          href="/fonts/plus-jakarta-sans-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
