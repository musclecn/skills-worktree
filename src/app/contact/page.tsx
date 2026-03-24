import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { StaticPageView } from "@/components/public/public-pages";
import { getPageData } from "@/lib/data";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageData("contact", "zh");
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/contact",
    pageKey: "contact",
    fallbackTitle: page?.title ? `${page.title} | 泰可思数科` : "联系我们 | 泰可思数科",
    fallbackDescription:
      page?.summary ||
      "联系泰可思获取企业税务数字化咨询、产品演示与实施方案支持。",
  });
}

export default async function ZhContactPage() {
  return (
    <PublicChrome locale="zh">
      <StaticPageView locale="zh" slug="contact" />
    </PublicChrome>
  );
}
