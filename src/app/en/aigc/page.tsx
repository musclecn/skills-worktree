import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { AIGCView } from "@/components/public/aigc-page";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/aigc",
    pageKey: "aigc",
    fallbackTitle: "AIGC Short Drama & Video Production | Taxs",
    fallbackDescription:
      "Taxs AIGC production: AI short dramas, AI video generation and episode quality review, from script and storyboard to vertical delivery.",
  });
}

export default async function EnAIGCPage() {
  return (
    <PublicChrome locale="en">
      <AIGCView locale="en" />
    </PublicChrome>
  );
}
