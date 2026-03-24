import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { NewsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/news",
    pageKey: "news",
    fallbackTitle: "News | Taxs",
    fallbackDescription: "Latest product releases, capability upgrades, and ecosystem updates from Taxs.",
  });
}

export default async function EnNewsPage() {
  return (
    <PublicChrome locale="en">
      <NewsView locale="en" />
    </PublicChrome>
  );
}
