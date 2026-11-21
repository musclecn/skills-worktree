import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { NewsView } from "@/components/public/public-pages";
import { parseNewsCategory } from "@/lib/data";
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

export default async function EnNewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; notice?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const category = parseNewsCategory(resolved?.category);

  return (
    <PublicChrome locale="en">
      <NewsView locale="en" category={category} untranslatedNotice={resolved?.notice === "untranslated"} />
    </PublicChrome>
  );
}
