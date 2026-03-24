import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { HomeView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/",
    pageKey: "home",
    fallbackTitle: "泰可思数科 | 企业税务数字一体化管理平台",
    fallbackDescription:
      "泰可思提供云票通、乐企接入、纳税申报、个税申报、税务风险、电子会计档案与出口退税等企业级财税产品能力。",
  });
}

export default async function ZhHomePage() {
  return (
    <PublicChrome locale="zh">
      <HomeView locale="zh" />
    </PublicChrome>
  );
}
