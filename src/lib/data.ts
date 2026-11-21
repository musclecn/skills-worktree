import { type NewsCategory, PublishStatus } from "@prisma/client";
import { pickLocalized } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/lib/types";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getSiteData(locale: AppLocale) {
  const setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!setting) {
    return null;
  }

  return {
    companyName: pickLocalized(setting, locale, "companyNameZh", "companyNameEn"),
    phone: setting.phone,
    fax: setting.fax,
    email: setting.email,
    address: pickLocalized(setting, locale, "addressZh", "addressEn"),
    icpRecord: setting.icpRecord,
    copyright: pickLocalized(setting, locale, "copyrightZh", "copyrightEn"),
    footerBuilder: pickLocalized(setting, locale, "footerBuilderZh", "footerBuilderEn"),
    logoUrl: setting.logoUrl,
    homeHeroTitle: pickLocalized(setting, locale, "homeHeroTitleZh", "homeHeroTitleEn"),
    homeHeroSubtitle: pickLocalized(setting, locale, "homeHeroSubtitleZh", "homeHeroSubtitleEn"),
    homeHeroImageUrl: setting.homeHeroImageUrl,
    homeProductSectionTitle: pickLocalized(
      setting,
      locale,
      "homeProductSectionTitleZh",
      "homeProductSectionTitleEn",
    ),
    homeProductSectionSubtitle: pickLocalized(
      setting,
      locale,
      "homeProductSectionSubtitleZh",
      "homeProductSectionSubtitleEn",
    ),
    homeSolutionSectionTitle: pickLocalized(
      setting,
      locale,
      "homeSolutionSectionTitleZh",
      "homeSolutionSectionTitleEn",
    ),
    homeSolutionSectionSubtitle: pickLocalized(
      setting,
      locale,
      "homeSolutionSectionSubtitleZh",
      "homeSolutionSectionSubtitleEn",
    ),
    homeProductImages: [
      setting.homeProductImage1,
      setting.homeProductImage2,
      setting.homeProductImage3,
      setting.homeProductImage4,
    ].filter((item): item is string => typeof item === "string" && item.trim().length > 0),
    homeSolutionImages: [
      setting.homeSolutionImage1,
      setting.homeSolutionImage2,
      setting.homeSolutionImage3,
    ].filter((item): item is string => typeof item === "string" && item.trim().length > 0),
    homeAboutTitle: pickLocalized(setting, locale, "homeAboutTitleZh", "homeAboutTitleEn"),
    homeAboutContent: pickLocalized(setting, locale, "homeAboutContentZh", "homeAboutContentEn"),
    homeContactTitle: pickLocalized(setting, locale, "homeContactTitleZh", "homeContactTitleEn"),
  };
}

export async function getMenuData(locale: AppLocale) {
  const menus = await prisma.menu.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });

  return menus.map((menu) => ({
    id: menu.id,
    key: menu.menuKey,
    label: pickLocalized(menu, locale, "labelZh", "labelEn"),
    path: menu.path,
  }));
}

export async function getHomeData(locale: AppLocale) {
  const [site, productCategories, solutions, news, industryNews] = await Promise.all([
    getSiteData(locale),
    prisma.productCategory.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      orderBy: { sortOrder: "asc" },
      take: 5,
    }),
    prisma.solution.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.newsPost.findMany({
      where: { publishStatus: PublishStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
      take: 4,
    }),
    prisma.newsPost.findMany({
      where: {
        publishStatus: PublishStatus.PUBLISHED,
        newsCategory: "INDUSTRY",
      },
      orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
      take: 5,
    }),
  ]);

  return {
    site,
    categories: productCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: pickLocalized(category, locale, "nameZh", "nameEn"),
      description: pickLocalized(category, locale, "descriptionZh", "descriptionEn"),
      iconUrl: category.iconUrl,
    })),
    solutions: solutions.map((solution) => ({
      id: solution.id,
      slug: solution.slug,
      title: pickLocalized(solution, locale, "titleZh", "titleEn"),
      summary: pickLocalized(solution, locale, "summaryZh", "summaryEn"),
      coverUrl: solution.coverUrl,
    })),
    news: news.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: pickLocalized(item, locale, "titleZh", "titleEn"),
      summary: pickLocalized(item, locale, "summaryZh", "summaryEn"),
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
    })),
    industryNews: industryNews.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: pickLocalized(item, locale, "titleZh", "titleEn"),
      summary: pickLocalized(item, locale, "summaryZh", "summaryEn"),
      publishedAt: item.publishedAt,
      newsCategory: item.newsCategory,
      sourceName: item.sourceName,
    })),
  };
}

export async function getProductsData(locale: AppLocale) {
  const categories = await prisma.productCategory.findMany({
    where: { publishStatus: PublishStatus.PUBLISHED },
    include: {
      products: {
        where: { publishStatus: PublishStatus.PUBLISHED },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: pickLocalized(category, locale, "nameZh", "nameEn"),
    description: pickLocalized(category, locale, "descriptionZh", "descriptionEn"),
    products: category.products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: pickLocalized(product, locale, "nameZh", "nameEn"),
      summary: pickLocalized(product, locale, "summaryZh", "summaryEn"),
      bannerUrl: product.bannerUrl,
      galleryImages: normalizeStringArray(product.galleryImages),
    })),
  }));
}

export async function getProductDetail(slug: string, locale: AppLocale) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      sections: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product || product.publishStatus !== PublishStatus.PUBLISHED) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    name: pickLocalized(product, locale, "nameZh", "nameEn"),
    summary: pickLocalized(product, locale, "summaryZh", "summaryEn"),
    bannerUrl: product.bannerUrl,
    galleryImages: normalizeStringArray(product.galleryImages),
    categorySlug: product.category.slug,
    categoryName: pickLocalized(product.category, locale, "nameZh", "nameEn"),
    sections: product.sections.map((section) => ({
      id: section.id,
      type: section.sectionType,
      title: pickLocalized(section, locale, "titleZh", "titleEn"),
      description: pickLocalized(section, locale, "descriptionZh", "descriptionEn"),
      imageUrl: section.imageUrl,
      items: section.items.map((item) => ({
        id: item.id,
        title: pickLocalized(item, locale, "titleZh", "titleEn"),
        description: pickLocalized(item, locale, "descriptionZh", "descriptionEn"),
        iconUrl: item.iconUrl,
      })),
    })),
  };
}

export async function getSolutionsData(locale: AppLocale) {
  const solutions = await prisma.solution.findMany({
    where: { publishStatus: PublishStatus.PUBLISHED },
    orderBy: { sortOrder: "asc" },
  });

  return solutions.map((solution) => ({
    id: solution.id,
    slug: solution.slug,
    title: pickLocalized(solution, locale, "titleZh", "titleEn"),
    summary: pickLocalized(solution, locale, "summaryZh", "summaryEn"),
    coverUrl: solution.coverUrl,
  }));
}

export async function getSolutionDetail(slug: string, locale: AppLocale) {
  const solution = await prisma.solution.findUnique({
    where: { slug },
    include: {
      painPoints: { orderBy: { sortOrder: "asc" } },
      advantages: { orderBy: { sortOrder: "asc" } },
      architectures: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!solution || solution.publishStatus !== PublishStatus.PUBLISHED) {
    return null;
  }

  return {
    id: solution.id,
    slug: solution.slug,
    title: pickLocalized(solution, locale, "titleZh", "titleEn"),
    summary: pickLocalized(solution, locale, "summaryZh", "summaryEn"),
    coverUrl: solution.coverUrl,
    painPoints: solution.painPoints.map((item) => ({
      id: item.id,
      title: pickLocalized(item, locale, "titleZh", "titleEn"),
      description: pickLocalized(item, locale, "descriptionZh", "descriptionEn"),
      iconUrl: item.iconUrl,
    })),
    advantages: solution.advantages.map((item) => ({
      id: item.id,
      title: pickLocalized(item, locale, "titleZh", "titleEn"),
      description: pickLocalized(item, locale, "descriptionZh", "descriptionEn"),
      iconUrl: item.iconUrl,
    })),
    architectures: solution.architectures.map((item) => ({
      id: item.id,
      title: pickLocalized(item, locale, "titleZh", "titleEn"),
      description: pickLocalized(item, locale, "descriptionZh", "descriptionEn"),
      imageUrl: item.imageUrl,
    })),
  };
}

export type NewsCategoryFilter = NewsCategory | "ALL";

export function parseNewsCategory(value: string | null | undefined): NewsCategoryFilter {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "COMPANY") return "COMPANY";
  if (normalized === "INDUSTRY") return "INDUSTRY";
  return "ALL";
}

export async function getNewsData(locale: AppLocale, category: NewsCategoryFilter = "ALL") {
  const items = await prisma.newsPost.findMany({
    where: {
      publishStatus: PublishStatus.PUBLISHED,
      ...(category === "ALL" ? {} : { newsCategory: category }),
    },
    orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: pickLocalized(item, locale, "titleZh", "titleEn"),
    summary: pickLocalized(item, locale, "summaryZh", "summaryEn"),
    publishedAt: item.publishedAt,
    coverUrl: item.coverUrl,
    newsCategory: item.newsCategory,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
  }));
}

export async function getNewsDetail(slug: string, locale: AppLocale) {
  const item = await prisma.newsPost.findUnique({
    where: { slug },
  });
  if (!item || item.publishStatus !== PublishStatus.PUBLISHED) {
    return null;
  }

  return {
    id: item.id,
    slug: item.slug,
    title: pickLocalized(item, locale, "titleZh", "titleEn"),
    summary: pickLocalized(item, locale, "summaryZh", "summaryEn"),
    content: pickLocalized(item, locale, "contentZh", "contentEn"),
    coverUrl: item.coverUrl,
    publishedAt: item.publishedAt,
    newsCategory: item.newsCategory,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    hasEnglish: hasEnglishNews(item),
    related: pickRelatedEntry(item, locale),
  };
}

/** 新闻正文后的相关入口：需要站内路径和对应语言的文案都存在才显示。 */
function pickRelatedEntry(
  item: { relatedPath: string | null; relatedLabelZh: string | null; relatedLabelEn: string | null },
  locale: AppLocale,
) {
  const path = item.relatedPath?.trim() ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  const label = pickLocalized(item, locale, "relatedLabelZh", "relatedLabelEn").trim();
  return label ? { path, label } : null;
}

function hasEnglishNews(item: { titleEn: string | null; contentEn: string | null }) {
  return Boolean(item.titleEn?.trim()) && Boolean(item.contentEn?.trim());
}

/** 新闻是否有英文译文；文章不存在或未发布时返回 null。 */
export async function getNewsEnglishAvailability(slug: string) {
  const item = await prisma.newsPost.findUnique({
    where: { slug },
    select: { titleEn: true, contentEn: true, publishStatus: true },
  });
  if (!item || item.publishStatus !== PublishStatus.PUBLISHED) {
    return null;
  }
  return hasEnglishNews(item);
}

export async function getPageData(slug: string, locale: AppLocale) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || page.publishStatus !== PublishStatus.PUBLISHED) {
    return null;
  }

  return {
    id: page.id,
    slug: page.slug,
    title: pickLocalized(page, locale, "titleZh", "titleEn"),
    summary: pickLocalized(page, locale, "summaryZh", "summaryEn"),
    content: pickLocalized(page, locale, "contentZh", "contentEn"),
    blocks: page.blocks,
  };
}
