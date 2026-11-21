import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ChineseTermsOfServiceView } from "@/components/public/legal-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/terms",
    pageKey: "terms",
    fallbackTitle: "服务条款 | 泰可思",
    fallbackDescription: "苏州泰可思数据科技有限公司出口销售再核算服务的使用条款。",
  });
}

export default async function Page() {
  return (
    <PublicChrome locale="zh" legalPage="/terms">
      <ChineseTermsOfServiceView />
    </PublicChrome>
  );
}
