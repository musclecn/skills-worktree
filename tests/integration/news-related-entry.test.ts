import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("news related entry and translation state", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-news-related");
    process.env.DATABASE_URL = databaseUrl;
    setupDatabase(databaseUrl);
  });

  beforeEach(() => {
    vi.resetModules();
  });

  afterAll(() => {
    cleanupDatabase(databaseUrl);
  });

  it("shows the related entry only when a site path and label are configured (N1, N3)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { getNewsDetail } = await import("@/lib/data");

    const base = {
      titleZh: "中国石化交易即开票",
      titleEn: "Sinopec pay-and-invoice",
      contentZh: "正文",
      contentEn: "Body",
      newsCategory: "INDUSTRY" as const,
      publishedAt: new Date(),
    };
    await prisma.newsPost.create({
      data: {
        ...base,
        slug: "related-configured",
        relatedPath: "/solutions/leqi-joint-use-solution",
        relatedLabelZh: "查看乐企联用方案与在线演示",
        relatedLabelEn: "See the Leqi joint-use solution and live demo",
      },
    });
    await prisma.newsPost.create({ data: { ...base, slug: "related-empty" } });
    await prisma.newsPost.create({
      data: { ...base, slug: "related-external", relatedPath: "https://example.com/", relatedLabelZh: "外部链接" },
    });

    expect((await getNewsDetail("related-configured", "zh"))?.related).toEqual({
      path: "/solutions/leqi-joint-use-solution",
      label: "查看乐企联用方案与在线演示",
    });
    expect((await getNewsDetail("related-configured", "en"))?.related?.label).toBe(
      "See the Leqi joint-use solution and live demo",
    );
    expect((await getNewsDetail("related-empty", "zh"))?.related).toBeNull();
    // 只接受站内路径
    expect((await getNewsDetail("related-external", "zh"))?.related).toBeNull();
  });

  it("reports whether an english translation exists (L3)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { getNewsDetail, getNewsEnglishAvailability } = await import("@/lib/data");

    await prisma.newsPost.create({
      data: {
        slug: "zh-only-article",
        titleZh: "仅中文的文章",
        titleEn: "",
        contentZh: "中文正文",
        contentEn: "",
        publishedAt: new Date(),
      },
    });

    expect(await getNewsEnglishAvailability("zh-only-article")).toBe(false);
    expect(await getNewsEnglishAvailability("related-configured")).toBe(true);
    expect(await getNewsEnglishAvailability("no-such-article")).toBeNull();

    const fallback = await getNewsDetail("zh-only-article", "en");
    expect(fallback?.hasEnglish).toBe(false);
    expect(fallback?.title).toBe("仅中文的文章");
  });
});
