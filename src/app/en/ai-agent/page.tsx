import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIAgentView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/ai-agent",
    pageKey: "ai-agent",
    fallbackTitle: "AI Tax Agent | Taxs",
    fallbackDescription:
      "Taxs AI tax agent section covering global invoice processing, intelligent filing, tax advisory, and cross-border compliance governance.",
  });
}

export default async function EnAIAgentPage() {
  return (
    <PublicChrome locale="en">
      <AIAgentView locale="en" />
    </PublicChrome>
  );
}
