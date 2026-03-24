import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { NewsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/news",
    pageKey: "news",
    fallbackTitle: "新闻动态 | 泰可思数科",
    fallbackDescription: "关注财税产品发布、平台升级与生态合作进展，获取泰可思最新动态。",
  });
}

export default async function ZhNewsPage() {
  return (
    <PublicChrome locale="zh">
      <NewsView locale="zh" />
    </PublicChrome>
  );
}
