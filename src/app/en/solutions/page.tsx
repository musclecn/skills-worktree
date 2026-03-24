import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { SolutionsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/solutions",
    pageKey: "solutions",
    fallbackTitle: "Solutions | Taxs",
    fallbackDescription:
      "Industry-focused delivery paths for enterprise tax digitization, compliance control, and large-scale filing operations.",
  });
}

export default async function EnSolutionsPage() {
  return (
    <PublicChrome locale="en">
      <SolutionsView locale="en" />
    </PublicChrome>
  );
}
