import type { MetadataRoute } from "next";
import { PublishStatus } from "@prisma/client";
import { localizePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_BASE_URL = "http://localhost:3000";

function getSiteBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return FALLBACK_BASE_URL;
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function toAbsoluteUrl(path: string) {
  return `${getSiteBaseUrl()}${path}`;
}

function createEntry(
  url: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url,
    lastModified,
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/about",
    "/contact",
    "/products",
    "/solutions",
    "/ai-agent",
    "/aigc",
    "/ai-agent/cases/digital-tax-employee",
    "/open-platform",
    "/short-videos",
    "/news",
  ];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) => [
    createEntry(
      toAbsoluteUrl(localizePath("zh", path)),
      new Date(),
      "weekly",
      path === "/" ? 1 : 0.8,
    ),
    createEntry(
      toAbsoluteUrl(localizePath("en", path)),
      new Date(),
      "weekly",
      path === "/" ? 0.9 : 0.7,
    ),
  ]);

  // 产品页仅英文，法律页面提供中英文版本。
  const englishOnlyEntries: MetadataRoute.Sitemap = ["/export-sales-reconciliation", "/privacy", "/terms"].map((path) =>
    createEntry(toAbsoluteUrl(localizePath("en", path)), new Date(), "monthly", 0.6),
  );

  const chineseLegalEntries: MetadataRoute.Sitemap = ["/privacy", "/terms"].map((path) =>
    createEntry(toAbsoluteUrl(path), new Date(), "monthly", 0.6),
  );

  const [products, solutions, news] = await Promise.all([
    prisma.product.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.solution.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.newsPost.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const detailEntries: MetadataRoute.Sitemap = [
    ...products.flatMap((item) => [
      createEntry(toAbsoluteUrl(localizePath("zh", `/products/${item.slug}`)), item.updatedAt, "weekly", 0.7),
      createEntry(toAbsoluteUrl(localizePath("en", `/products/${item.slug}`)), item.updatedAt, "weekly", 0.6),
    ]),
    ...solutions.flatMap((item) => [
      createEntry(
        toAbsoluteUrl(localizePath("zh", `/solutions/${item.slug}`)),
        item.updatedAt,
        "weekly",
        0.7,
      ),
      createEntry(
        toAbsoluteUrl(localizePath("en", `/solutions/${item.slug}`)),
        item.updatedAt,
        "weekly",
        0.6,
      ),
    ]),
    ...news.flatMap((item) => [
      createEntry(toAbsoluteUrl(localizePath("zh", `/news/${item.slug}`)), item.updatedAt, "daily", 0.6),
      createEntry(toAbsoluteUrl(localizePath("en", `/news/${item.slug}`)), item.updatedAt, "daily", 0.5),
    ]),
  ];

  return [...staticEntries, ...englishOnlyEntries, ...chineseLegalEntries, ...detailEntries];
}
