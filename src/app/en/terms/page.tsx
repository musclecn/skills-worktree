import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { TermsOfServiceView, ESR_APP_NAME } from "@/components/public/legal-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/terms",
    pageKey: "terms",
    fallbackTitle: "Terms of Service | Taxs",
    fallbackDescription: `Terms of Service for ${ESR_APP_NAME} provided by Suzhou Taxs Data Technology Co., Ltd.`,
  });
}

export default async function EnTermsPage() {
  return (
    <PublicChrome locale="en" legalPage="/terms">
      <TermsOfServiceView />
    </PublicChrome>
  );
}
