import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { StaticPageView } from "@/components/public/public-pages";
import { getPageData } from "@/lib/data";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageData("about", "en");
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/about",
    pageKey: "about",
    fallbackTitle: page?.title ? `${page.title} | Taxs` : "About | Taxs",
    fallbackDescription:
      page?.summary ||
      "Learn about Taxs, our team background, and our approach to enterprise tax digitization.",
  });
}

export default async function EnAboutPage() {
  return (
    <PublicChrome locale="en">
      <StaticPageView locale="en" slug="about" />
    </PublicChrome>
  );
}
