import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { NewsView } from "@/components/public/public-pages";
import { parseNewsCategory, parseNewsPage } from "@/lib/data";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; page?: string }>;
}): Promise<Metadata> {
  const resolved = searchParams ? await searchParams : undefined;
  const category = parseNewsCategory(resolved?.category);
  const page = parseNewsPage(resolved?.page);
  // 第 2 页起各页使用自身地址作为规范地址，避免被当作第 1 页的重复内容
  const query = new URLSearchParams();
  if (page > 1 && category !== "ALL") query.set("category", category.toLowerCase());
  if (page > 1) query.set("page", String(page));
  const metadata = await buildSeoMetadataByPageKey({
    locale: "zh",
    path: query.toString() ? `/news?${query.toString()}` : "/news",
    pageKey: "news",
    fallbackTitle: "新闻动态 | 泰可思数科",
    fallbackDescription: "关注财税产品发布、平台升级与生态合作进展，获取泰可思最新动态。",
  });
  if (page > 1 && typeof metadata.title === "string") {
    metadata.title = `${metadata.title} - 第${page}页`;
  }
  return metadata;
}

export default async function ZhNewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; page?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const category = parseNewsCategory(resolved?.category);
  const page = parseNewsPage(resolved?.page);

  return (
    <PublicChrome locale="zh">
      <NewsView locale="zh" category={category} page={page} />
    </PublicChrome>
  );
}
