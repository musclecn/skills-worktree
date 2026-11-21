import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("openclaw news ingest API", () => {
  let databaseUrl = "";
  const ingestToken = "integration-openclaw-token";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-openclaw-news");
    process.env.DATABASE_URL = databaseUrl;
    process.env.OPENCLAW_INGEST_TOKEN = ingestToken;
    setupDatabase(databaseUrl);
  });

  beforeEach(() => {
    vi.resetModules();
    process.env.OPENCLAW_INGEST_TOKEN = ingestToken;
  });

  afterAll(() => {
    cleanupDatabase(databaseUrl);
  });

  it("accepts ingest payload and publishes industry news", async () => {
    const { POST: INGEST_NEWS } = await import("@/app/api/openclaw/news/route");
    const { GET: GET_PUBLIC_NEWS } = await import("@/app/api/public/news/route");

    const ingestResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              externalId: "openclaw-integration-001",
              slug: "openclaw-integration-news",
              category: "INDUSTRY",
              titleZh: "OpenClaw 行业新闻（集成测试）",
              contentZh: "用于验证采集接口自动发布行业新闻。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/integration/news-001",
            },
          ],
        }),
      }),
    );

    expect(ingestResponse.status).toBe(200);
    const ingestJson = await ingestResponse.json();
    expect(ingestJson.data.created).toBe(1);

    const industryListResponse = await GET_PUBLIC_NEWS(
      new Request("http://localhost/api/public/news?lang=zh&category=industry"),
    );
    expect(industryListResponse.status).toBe(200);
    const industryListJson = await industryListResponse.json();
    const hasTarget = Array.isArray(industryListJson.data)
      ? industryListJson.data.some((item: { slug: string }) => item.slug === "openclaw-integration-news")
      : false;
    expect(hasTarget).toBe(true);
  });

  it("updates existing post by externalId and rejects unauthorized requests", async () => {
    const { POST: INGEST_NEWS } = await import("@/app/api/openclaw/news/route");
    const { GET: GET_PUBLIC_NEWS } = await import("@/app/api/public/news/route");

    const unauthorizedResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: "openclaw-integration-001",
          titleZh: "未授权请求",
          contentZh: "不应成功。",
        }),
      }),
    );
    expect(unauthorizedResponse.status).toBe(401);

    const updateResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          "x-openclaw-token": ingestToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalId: "openclaw-integration-001",
          category: "INDUSTRY",
          titleZh: "OpenClaw 行业新闻（更新版）",
          summaryZh: "更新后的摘要",
          contentZh: "更新后的正文内容。",
          sourceName: "OpenClaw",
          sourceUrl: "https://example.com/integration/news-001",
        }),
      }),
    );

    expect(updateResponse.status).toBe(200);
    const updateJson = await updateResponse.json();
    expect(updateJson.data.updated).toBe(1);

    const detailResponse = await GET_PUBLIC_NEWS(
      new Request("http://localhost/api/public/news?lang=zh&slug=openclaw-integration-news"),
    );
    expect(detailResponse.status).toBe(200);
    const detailJson = await detailResponse.json();
    expect(detailJson.data.summary).toContain("更新后的摘要");
  });

  it("dedupes repeated crawl items by normalized source URL and semantic signature", async () => {
    const { POST: INGEST_NEWS } = await import("@/app/api/openclaw/news/route");
    const { GET: GET_PUBLIC_NEWS } = await import("@/app/api/public/news/route");

    const firstResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              externalId: "openclaw-duplicate-url-001",
              category: "INDUSTRY",
              titleZh: "AI驱动税务全流程管理落地",
              summaryZh: "用于验证URL归一化去重。",
              contentZh: "同一篇新闻的正文内容，验证每日采集时防止重复入库。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/ai-tax?utm_source=openclaw&spm=abc",
              publishedAt: "2026-04-08T08:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(firstResponse.status).toBe(200);
    const firstJson = await firstResponse.json();
    expect(firstJson.data.created).toBe(1);

    const secondResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              externalId: "openclaw-duplicate-url-002",
              category: "INDUSTRY",
              titleZh: "重磅发布四大新品，赋能企业数智化转型",
              summaryZh: "同一新闻再次采集，标题有轻微差异。",
              contentZh: "11月10日，同一篇新闻的正文内容，验证每日采集时防止重复入库，并支持内容级别去重。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/ai-tax?utm_medium=bot&from=feed#section",
              publishedAt: "2026-04-08T09:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(secondResponse.status).toBe(200);
    const secondJson = await secondResponse.json();
    expect(secondJson.data.created).toBe(0);
    expect(secondJson.data.updated).toBe(1);

    const listResponse = await GET_PUBLIC_NEWS(
      new Request("http://localhost/api/public/news?lang=zh&category=industry"),
    );
    expect(listResponse.status).toBe(200);
    const listJson = await listResponse.json();
    const matches = Array.isArray(listJson.data)
      ? listJson.data.filter((item: { sourceUrl?: string | null }) => item.sourceUrl === "https://example.com/news/ai-tax")
      : [];
    expect(matches).toHaveLength(1);
  });

  it("dedupes when titles share at least 5 consecutive characters", async () => {
    const { POST: INGEST_NEWS } = await import("@/app/api/openclaw/news/route");

    const firstResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              externalId: "openclaw-title-overlap-001",
              category: "INDUSTRY",
              titleZh: "智能税务引擎平台正式发布并全面升级",
              summaryZh: "首篇用于验证标题重合去重。",
              contentZh: "第一篇新闻正文，强调新品发布和财税智能化方向。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/title-overlap-1",
              publishedAt: "2026-04-09T08:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(firstResponse.status).toBe(200);
    const firstJson = await firstResponse.json();
    expect(firstJson.data.created).toBe(1);

    const secondResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              externalId: "openclaw-title-overlap-002",
              category: "INDUSTRY",
              titleZh: "智能税务引擎平台助力集团税务数字化转型",
              summaryZh: "二次采集标题存在连续 5 字重合。",
              contentZh: "第二篇新闻正文内容不同，用于验证标题规则优先拦截重复。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/title-overlap-2",
              publishedAt: "2026-04-09T09:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(secondResponse.status).toBe(200);
    const secondJson = await secondResponse.json();
    expect(secondJson.data.created).toBe(0);
    expect(secondJson.data.updated).toBe(1);
  });

  it("does not semantic-dedupe items that already have distinct slug and sourceUrl", async () => {
    const { POST: INGEST_NEWS } = await import("@/app/api/openclaw/news/route");
    const { GET: GET_PUBLIC_NEWS } = await import("@/app/api/public/news/route");

    const firstResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              slug: "openclaw-distinct-story-001",
              category: "INDUSTRY",
              titleZh: "三都税务：“支付即开票”开启办税新体验",
              summaryZh: "验证相似专题文章不会被错误覆盖。",
              contentZh: "文章一：围绕支付即开票在三都县的场景落地与效率提升。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/distinct-story-001",
              publishedAt: "2026-04-10T08:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(firstResponse.status).toBe(200);
    const firstJson = await firstResponse.json();
    expect(firstJson.data.created).toBe(1);

    const secondResponse = await INGEST_NEWS(
      new Request("http://localhost/api/openclaw/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              slug: "openclaw-distinct-story-002",
              category: "INDUSTRY",
              titleZh: "黔西南税务：全面推广“支付即开票” 赋能便民利企提质增效",
              summaryZh: "验证第二篇相似专题文章保留独立 slug。",
              contentZh: "文章二：同样是支付即开票专题，但来源、标题和正文都是另一篇独立新闻。",
              sourceName: "OpenClaw",
              sourceUrl: "https://example.com/news/distinct-story-002",
              publishedAt: "2026-04-10T09:00:00+08:00",
            },
          ],
        }),
      }),
    );
    expect(secondResponse.status).toBe(200);
    const secondJson = await secondResponse.json();
    expect(secondJson.data.created).toBe(1);
    expect(secondJson.data.updated).toBe(0);

    const firstDetail = await GET_PUBLIC_NEWS(
      new Request("http://localhost/api/public/news?lang=zh&slug=openclaw-distinct-story-001"),
    );
    expect(firstDetail.status).toBe(200);
    const firstDetailJson = await firstDetail.json();
    expect(firstDetailJson.data.title).toContain("三都税务");

    const secondDetail = await GET_PUBLIC_NEWS(
      new Request("http://localhost/api/public/news?lang=zh&slug=openclaw-distinct-story-002"),
    );
    expect(secondDetail.status).toBe(200);
    const secondDetailJson = await secondDetail.json();
    expect(secondDetailJson.data.title).toContain("黔西南税务");
  });
});
