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
  const solution = await getSolutionDetail(slug, "zh");

  return buildPageMetadata({
    locale: "zh",
    path: `/solutions/${slug}`,
    title: solution ? `${solution.title} | 解决方案 | 泰可思数科` : "方案详情 | 泰可思数科",
    description: solution?.summary || "查看泰可思行业解决方案详情、业务痛点与实施优势。",
    ogImageUrl: solution?.coverUrl,
  });
}

export default async function ZhSolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="zh">
      <SolutionDetailView locale="zh" slug={slug} />
    </PublicChrome>
  );
}
