import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { NewsDetailView } from "@/components/public/public-pages";
import { getNewsDetail } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsDetail(slug, "en");

  return buildPageMetadata({
    locale: "en",
    path: `/news/${slug}`,
    title: article ? `${article.title} | News | Taxs` : "News Detail | Taxs",
    description: article?.summary || "Read Taxs updates on product releases and industry implementation practices.",
    ogImageUrl: article?.coverUrl,
  });
}

export default async function EnNewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="en">
      <NewsDetailView locale="en" slug={slug} />
    </PublicChrome>
  );
}
