import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ChinesePrivacyPolicyView } from "@/components/public/legal-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/privacy",
    pageKey: "privacy",
    fallbackTitle: "隐私政策 | 泰可思",
    fallbackDescription: "了解苏州泰可思数据科技有限公司如何收集、使用、存储、保护、共享和删除出口销售再核算服务中的数据。",
  });
}

export default async function Page() {
  return (
    <PublicChrome locale="zh" legalPage="/privacy">
      <ChinesePrivacyPolicyView />
    </PublicChrome>
  );
}
