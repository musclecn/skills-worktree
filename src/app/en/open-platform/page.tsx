import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { OpenPlatformView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/open-platform",
    pageKey: "open-platform",
    fallbackTitle: "Open Platform | Taxs",
    fallbackDescription:
      "Taxs Open Platform presets API capabilities for output invoicing, input invoice management, filing, Leqi integration, invoice verification, OCR, fiscal bill verification, and tax risk management.",
  });
}

export default async function EnOpenPlatformPage() {
  return (
    <PublicChrome locale="en">
      <OpenPlatformView locale="en" />
    </PublicChrome>
  );
}
