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
  const article = await getNewsDetail(slug, "zh");

  return buildPageMetadata({
    locale: "zh",
    path: `/news/${slug}`,
    title: article ? `${article.title} | 新闻动态 | 泰可思数科` : "新闻详情 | 泰可思数科",
    description: article?.summary || "查看泰可思新闻动态、产品升级与行业实践。",
    ogImageUrl: article?.coverUrl,
  });
}

export default async function ZhNewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="zh">
      <NewsDetailView locale="zh" slug={slug} />
    </PublicChrome>
  );
}
