import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { SolutionDetailView } from "@/components/public/public-pages";
import { getSolutionDetail } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionDetail(slug, "en");

  return buildPageMetadata({
    locale: "en",
    path: `/solutions/${slug}`,
    title: solution ? `${solution.title} | Solutions | Taxs` : "Solution Detail | Taxs",
    description: solution?.summary || "Explore Taxs solution details, pain points, and implementation advantages.",
    ogImageUrl: solution?.coverUrl,
  });
}

export default async function EnSolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="en">
      <SolutionDetailView locale="en" slug={slug} />
    </PublicChrome>
  );
}
