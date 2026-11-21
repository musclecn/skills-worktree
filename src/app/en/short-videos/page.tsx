import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ShortVideosView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/short-videos",
    pageKey: "short-videos",
    fallbackTitle: "Video Introduction | Taxs",
    fallbackDescription:
      "Taxs short video gallery for digital tax, YPT, Leqi integration, invoice risk control, and AI tax agent scenarios.",
  });
}

export default async function EnShortVideosPage() {
  return (
    <PublicChrome locale="en">
      <ShortVideosView locale="en" />
    </PublicChrome>
  );
}
