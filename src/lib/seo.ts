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

function toAbsoluteUrl(path: string) {
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
