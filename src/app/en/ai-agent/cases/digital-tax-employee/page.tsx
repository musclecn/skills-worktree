import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIAgentDigitalEmployeeCaseView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/ai-agent/cases/digital-tax-employee",
    pageKey: "ai-agent-case-digital-tax-employee",
    fallbackTitle: "AI Tax Digital Employee Case | Taxs",
    fallbackDescription:
      "Case page for AI tax digital employee, covering automated contract drafting and intelligent acceptance-file archiving.",
  });
}

export default async function EnAIAgentDigitalEmployeeCasePage() {
  return (
    <PublicChrome locale="en">
      <AIAgentDigitalEmployeeCaseView locale="en" />
    </PublicChrome>
  );
}
