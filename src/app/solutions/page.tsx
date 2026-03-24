import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { SolutionsView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/solutions",
    pageKey: "solutions",
    fallbackTitle: "解决方案 | 泰可思数科",
    fallbackDescription: "面向集团企业、高频税务场景和复杂合规需求的行业解决方案与实施路径。",
  });
}

export default async function ZhSolutionsPage() {
  return (
    <PublicChrome locale="zh">
      <SolutionsView locale="zh" />
    </PublicChrome>
  );
}
