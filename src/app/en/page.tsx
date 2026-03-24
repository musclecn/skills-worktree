import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { HomeView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/",
    pageKey: "home",
    fallbackTitle: "Taxs | Enterprise Digital Tax Integration Platform",
    fallbackDescription:
      "Taxs delivers enterprise tax capabilities including YPT platform, Leqi integration, filing automation, IIT filing, risk governance, e-archive, and export rebate.",
  });
}

export default async function EnHomePage() {
  return (
    <PublicChrome locale="en">
      <HomeView locale="en" />
    </PublicChrome>
  );
}
