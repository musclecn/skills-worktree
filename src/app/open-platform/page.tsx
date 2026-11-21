import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { OpenPlatformView } from "@/components/public/public-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "zh",
    path: "/open-platform",
    pageKey: "open-platform",
    fallbackTitle: "开放平台 | 泰可思数科",
    fallbackDescription:
      "泰可思开放平台预置销项开票、进项管理、申报管理、乐企接入、发票查验、OCR、票据查验与税务风险管理等 API 能力。",
  });
}

export default async function ZhOpenPlatformPage() {
  return (
    <PublicChrome locale="zh">
      <OpenPlatformView locale="zh" />
    </PublicChrome>
  );
}
