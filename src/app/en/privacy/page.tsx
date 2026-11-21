import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { PrivacyPolicyView, ESR_APP_NAME } from "@/components/public/legal-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/privacy",
    pageKey: "privacy",
    fallbackTitle: "Privacy Policy | Taxs",
    fallbackDescription: `How Suzhou Taxs Data Technology Co., Ltd. collects, uses, stores, protects, shares and deletes data in ${ESR_APP_NAME}.`,
  });
}

export default async function EnPrivacyPage() {
  return (
    <PublicChrome locale="en" legalPage="/privacy">
      <PrivacyPolicyView />
    </PublicChrome>
  );
}
