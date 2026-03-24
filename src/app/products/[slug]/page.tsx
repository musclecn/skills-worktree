import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ProductDetailView } from "@/components/public/public-pages";
import { getProductDetail } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug, "zh");

  return buildPageMetadata({
    locale: "zh",
    path: `/products/${slug}`,
    title: product ? `${product.name} | 产品中心 | 泰可思数科` : "产品详情 | 泰可思数科",
    description: product?.summary || "查看泰可思企业财税产品详情、能力模块与落地场景。",
    ogImageUrl: product?.bannerUrl,
  });
}

export default async function ZhProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="zh">
      <ProductDetailView locale="zh" slug={slug} />
    </PublicChrome>
  );
}
