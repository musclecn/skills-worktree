import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIAgentDigitalEmployeeCaseView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/ai-agent/cases/digital-tax-employee",
    pageKey: "ai-agent-case-digital-tax-employee",
    fallbackTitle: "AI财税数字员工案例 | 泰可思数科",
    fallbackDescription:
      "案例聚焦合同自动生成与验收单智能归档，展示 AI 财税数字员工在效率、准确率与合规管理上的提升。",
  });
}

export default async function ZhAIAgentDigitalEmployeeCasePage() {
  return (
    <PublicChrome locale="zh">
      <AIAgentDigitalEmployeeCaseView locale="zh" />
    </PublicChrome>
  );
}
