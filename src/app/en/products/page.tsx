import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ProductsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/products",
    pageKey: "products",
    fallbackTitle: "Products | Taxs",
    fallbackDescription:
      "Enterprise tax product suite across invoice, filing, risk governance, e-archive, and data service capabilities.",
  });
}

export default async function EnProductsPage() {
  return (
    <PublicChrome locale="en">
      <ProductsView locale="en" />
    </PublicChrome>
  );
}
