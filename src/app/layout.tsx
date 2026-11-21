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
      <body>{children}</body>
    </html>
  );
}
