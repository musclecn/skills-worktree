import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ProductsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/products",
    pageKey: "products",
    fallbackTitle: "产品中心 | 泰可思数科",
    fallbackDescription: "覆盖票税财档核心能力的企业级财税产品体系，包括平台、申报、风控、档案与数据服务。",
  });
}

export default async function ZhProductsPage() {
  return (
    <PublicChrome locale="zh">
      <ProductsView locale="zh" />
    </PublicChrome>
  );
}
