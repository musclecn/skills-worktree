import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { StaticPageView } from "@/components/public/public-pages";
import { getPageData } from "@/lib/data";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageData("contact", "en");
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/contact",
    pageKey: "contact",
    fallbackTitle: page?.title ? `${page.title} | Taxs` : "Contact | Taxs",
    fallbackDescription:
      page?.summary || "Contact Taxs for enterprise tax digitization consultation and solution planning.",
  });
}

export default async function EnContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ appointment?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  return (
    <PublicChrome locale="en">
      <StaticPageView locale="en" slug="contact" appointmentStatus={resolved?.appointment} />
    </PublicChrome>
  );
}
