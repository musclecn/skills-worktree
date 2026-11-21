import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIAgentView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/ai-agent",
    pageKey: "ai-agent",
    fallbackTitle: "AI财税智能体 | 泰可思数科",
    fallbackDescription:
      "泰可思 AI 财税智能体栏目，覆盖全球票据处理、智能申报、税务顾问与跨境合规风险治理能力。",
  });
}

export default async function ZhAIAgentPage() {
  return (
    <PublicChrome locale="zh">
      <AIAgentView locale="zh" />
    </PublicChrome>
  );
}
