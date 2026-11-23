import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIGCView } from "@/components/public/aigc-page";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/aigc",
    pageKey: "aigc",
    fallbackTitle: "AIGC 短剧与视频制作 | 泰可思数科",
    fallbackDescription:
      "泰可思 AIGC 内容生产：AI 短剧制作、AI 视频生成与成片质量评审，从剧本、分镜到竖屏成片交付。",
  });
}

export default async function ZhAIGCPage() {
  return (
    <PublicChrome locale="zh">
      <AIGCView locale="zh" />
    </PublicChrome>
  );
}
