import type { Metadata } from "next";
import { localizePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/lib/types";

const FALLBACK_BASE_URL = "http://localhost:3000";

type BuildMetadataInput = {
  locale: AppLocale;
  path: string;
  title: string;
  description?: string | null;
  keywords?: string | null;
  ogImageUrl?: string | null;
};

type BuildSeoMetadataInput = {
  locale: AppLocale;
  path: string;
  pageKey: string;
  fallbackTitle: string;
  fallbackDescription?: string;
};

function getSiteBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return FALLBACK_BASE_URL;
  }

  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function getMetadataBase() {
  try {
    return new URL(getSiteBaseUrl());
  } catch {
    return new URL(FALLBACK_BASE_URL);
  }
}

function parseKeywords(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const keywords = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : undefined;
}

export function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${getSiteBaseUrl()}${path}`;
}

export function buildPageMetadata(input: BuildMetadataInput): Metadata {
  const canonicalPath = localizePath(input.locale, input.path);
  const description = input.description?.trim() || undefined;
  const image = input.ogImageUrl?.trim() || undefined;

  return {
    metadataBase: getMetadataBase(),
    title: input.title,
    description,
    keywords: parseKeywords(input.keywords),
    alternates: {
      canonical: canonicalPath,
      languages: {
        "zh-CN": localizePath("zh", input.path),
        "en-US": localizePath("en", input.path),
      },
    },
    openGraph: {
      title: input.title,
      description,
      url: canonicalPath,
      siteName: "Taxs",
      locale: input.locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
      images: image ? [toAbsoluteUrl(image)] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: image ? [toAbsoluteUrl(image)] : undefined,
    },
  };
}

export async function buildSeoMetadataByPageKey(input: BuildSeoMetadataInput): Promise<Metadata> {
  const seo = await prisma.seoMeta.findUnique({
    where: {
      pageKey_locale: {
        pageKey: input.pageKey,
        locale: input.locale,
      },
    },
  });

  return buildPageMetadata({
    locale: input.locale,
    path: input.path,
    title: seo?.title || input.fallbackTitle,
    description: seo?.description || input.fallbackDescription,
    keywords: seo?.keywords,
    ogImageUrl: seo?.ogImageUrl,
  });
}

type OrganizationSource = {
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
};

/**
 * 首页的组织结构化数据（schema.org Organization），帮助搜索引擎识别公司名称、Logo 与联系方式。
 * 输出前把 `<` 转义，防止内容里出现的标签打断 script（Next 官方 JSON-LD 指南的做法）。
 */
export function buildOrganizationJsonLd(locale: AppLocale, site: OrganizationSource | null | undefined) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site?.companyName || (locale === "zh" ? "苏州泰可思数据科技有限公司" : "Suzhou Taxs Data Technology Co., Ltd."),
    url: toAbsoluteUrl(localizePath(locale, "/")),
    logo: toAbsoluteUrl(site?.logoUrl || "/brand/taxs-logo.svg"),
  };
  if (site?.email) data.email = site.email;
  if (site?.phone) data.telephone = site.phone;
  if (site?.address) data.address = { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "CN" };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
