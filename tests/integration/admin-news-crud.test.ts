import { PublishStatus, UserRole } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("admin news CRUD and publish flow", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-admin-news");
    process.env.DATABASE_URL = databaseUrl;
    setupDatabase(databaseUrl);
  });

  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/lib/auth/guard", () => ({
      requireRole: vi.fn().mockResolvedValue({
        user: {
          id: "admin-user-id",
          email: "admin@sztaxs.com",
          name: "Admin",
          role: UserRole.ADMIN,
        },
      }),
    }));
  });

  afterAll(() => {
    vi.doUnmock("@/lib/auth/guard");
    cleanupDatabase(databaseUrl);
  });

  it("creates -> drafts -> publishes -> deletes a news post", async () => {
    const uniqueSlug = `integration-news-${Date.now()}`;

    const { POST } = await import("@/app/api/admin/news/route");
    const { PUT, DELETE: DELETE_BY_ID } = await import("@/app/api/admin/news/[id]/route");
    const { GET: GET_PUBLIC_NEWS } = await import("@/app/api/public/news/route");

    const createResponse = await POST(
      new Request("http://localhost/api/admin/news", {
        method: "POST",
        body: JSON.stringify({
          slug: uniqueSlug,
          titleZh: "集成测试新闻",
          titleEn: "Integration Test News",
          summaryZh: "用于测试发布流程",
          summaryEn: "Used for publish workflow testing",
          contentZh: "这是一条用于测试的新闻内容。",
          contentEn: "This is a test news content.",
          publishStatus: PublishStatus.PUBLISHED,
        }),
      }),
    );

    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()).data as { id: string; slug: string };
    expect(created.slug).toBe(uniqueSlug);

    const draftResponse = await PUT(
      new Request(`http://localhost/api/admin/news/${created.id}`, {
        method: "PUT",
        body: JSON.stringify({ publishStatus: PublishStatus.DRAFT }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(draftResponse.status).toBe(200);

    const hiddenPublicResponse = await GET_PUBLIC_NEWS(
      new Request(`http://localhost/api/public/news?lang=zh&slug=${uniqueSlug}`),
    );
    expect(hiddenPublicResponse.status).toBe(404);

    const publishResponse = await PUT(
      new Request(`http://localhost/api/admin/news/${created.id}`, {
        method: "PUT",
        body: JSON.stringify({ publishStatus: PublishStatus.PUBLISHED }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(publishResponse.status).toBe(200);

    const visiblePublicResponse = await GET_PUBLIC_NEWS(
      new Request(`http://localhost/api/public/news?lang=en&slug=${uniqueSlug}`),
    );
    expect(visiblePublicResponse.status).toBe(200);

    const deleteResponse = await DELETE_BY_ID(
      new Request(`http://localhost/api/admin/news/${created.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(deleteResponse.status).toBe(200);
  });
});
