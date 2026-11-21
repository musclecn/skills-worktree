import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ShortVideosView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/short-videos",
    pageKey: "short-videos",
    fallbackTitle: "视频介绍 | 泰可思数科",
    fallbackDescription: "泰可思视频介绍栏目，展示财税数字化、云票通、乐企接入、票据风控与 AI 财税智能体内容。",
  });
}

export default async function ZhShortVideosPage() {
  return (
    <PublicChrome locale="zh">
      <ShortVideosView locale="zh" />
    </PublicChrome>
  );
}
