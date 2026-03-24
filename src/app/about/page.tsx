import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { StaticPageView } from "@/components/public/public-pages";
import { getPageData } from "@/lib/data";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageData("about", "zh");
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/about",
    pageKey: "about",
    fallbackTitle: page?.title ? `${page.title} | 泰可思数科` : "关于我们 | 泰可思数科",
    fallbackDescription:
      page?.summary ||
      "了解泰可思数科的发展历程、核心团队与财税数字化产品能力建设方向。",
  });
}

export default async function ZhAboutPage() {
  return (
    <PublicChrome locale="zh">
      <StaticPageView locale="zh" slug="about" />
    </PublicChrome>
  );
}
