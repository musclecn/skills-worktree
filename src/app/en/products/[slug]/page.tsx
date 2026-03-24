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
  const product = await getProductDetail(slug, "en");

  return buildPageMetadata({
    locale: "en",
    path: `/products/${slug}`,
    title: product ? `${product.name} | Products | Taxs` : "Product Detail | Taxs",
    description: product?.summary || "View Taxs product details, core capability modules, and delivery scenarios.",
    ogImageUrl: product?.bannerUrl,
  });
}

export default async function EnProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PublicChrome locale="en">
      <ProductDetailView locale="en" slug={slug} />
    </PublicChrome>
  );
}
