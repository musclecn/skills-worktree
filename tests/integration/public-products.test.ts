import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("public products api", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-public");
    process.env.DATABASE_URL = databaseUrl;
    setupDatabase(databaseUrl);
  });

  afterAll(() => {
    cleanupDatabase(databaseUrl);
  });

  it("returns product list in zh/en and supports detail query by slug", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/public/products/route");

    const zhResponse = await GET(new Request("http://localhost/api/public/products?lang=zh"));
    const enResponse = await GET(new Request("http://localhost/api/public/products?lang=en"));

    expect(zhResponse.status).toBe(200);
    expect(enResponse.status).toBe(200);

    const zhBody = await zhResponse.json();
    const enBody = await enResponse.json();

    expect(Array.isArray(zhBody.data)).toBe(true);
    expect(Array.isArray(enBody.data)).toBe(true);
    expect(zhBody.data.length).toBeGreaterThan(0);
    expect(enBody.data.length).toBe(zhBody.data.length);

    const firstCategory = zhBody.data[0];
    expect(Array.isArray(firstCategory.products)).toBe(true);
    expect(firstCategory.products.length).toBeGreaterThan(0);

    const firstSlug = firstCategory.products[0].slug;
    const detailResponse = await GET(
      new Request(`http://localhost/api/public/products?lang=en&slug=${firstSlug}`),
    );

    expect(detailResponse.status).toBe(200);
    const detailBody = await detailResponse.json();
    expect(detailBody.data.slug).toBe(firstSlug);
    expect(typeof detailBody.data.name).toBe("string");
    expect(detailBody.data.name.length).toBeGreaterThan(0);
  });
});
