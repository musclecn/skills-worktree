import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("news list pagination", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-news-pages");
    process.env.DATABASE_URL = databaseUrl;
    setupDatabase(databaseUrl);
  });

  beforeEach(() => {
    vi.resetModules();
  });

  afterAll(() => {
    cleanupDatabase(databaseUrl);
  });

  it("pages through published news with a stable order and category filter", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { getNewsPage, parseNewsPage, NEWS_PAGE_SIZE } = await import("@/lib/data");
    await prisma.newsPost.deleteMany();
    const base = new Date("2026-11-01T00:00:00Z").getTime();
    for (let index = 0; index < 45; index += 1) {
      await prisma.newsPost.create({
        data: {
          slug: `page-test-${String(index).padStart(2, "0")}`,
          newsCategory: index % 3 === 0 ? "COMPANY" : "INDUSTRY",
          titleZh: `新闻 ${index}`,
          titleEn: `News ${index}`,
          contentZh: "正文",
          contentEn: "Body",
          publishedAt: new Date(base + index * 60_000),
        },
      });
    }
    await prisma.newsPost.create({
      data: { slug: "draft-hidden", titleZh: "草稿", titleEn: "Draft", contentZh: "x", contentEn: "x", publishStatus: "DRAFT" },
    });

    expect(NEWS_PAGE_SIZE).toBe(20);
    const first = await getNewsPage("zh", "ALL", 1);
    expect(first).toMatchObject({ total: 45, pageCount: 3, page: 1 });
    expect(first.items).toHaveLength(20);
    expect(first.items[0].slug).toBe("page-test-44");

    const last = await getNewsPage("zh", "ALL", 3);
    expect(last.items).toHaveLength(5);
    expect(last.items.at(-1)?.slug).toBe("page-test-00");

    const beyond = await getNewsPage("zh", "ALL", 4);
    expect(beyond.items).toHaveLength(0);
    expect(beyond.pageCount).toBe(3);

    const industry = await getNewsPage("en", "INDUSTRY", 2);
    expect(industry.total).toBe(30);
    expect(industry.items).toHaveLength(10);
    expect(industry.items.every((item) => item.newsCategory === "INDUSTRY")).toBe(true);

    expect(parseNewsPage("2")).toBe(2);
    expect(parseNewsPage("0")).toBe(1);
    expect(parseNewsPage("-3")).toBe(1);
    expect(parseNewsPage("2abc")).toBe(1);
    expect(parseNewsPage(undefined)).toBe(1);
  });
});
