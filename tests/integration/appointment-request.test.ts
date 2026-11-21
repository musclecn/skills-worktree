import { UserRole } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

describe.sequential("appointment request workflow", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-appointment");
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

  it("supports public submit and admin CRUD/export", async () => {
    const { POST: PUBLIC_POST } = await import("@/app/api/public/appointments/route");
    const { GET: ADMIN_LIST } = await import("@/app/api/admin/appointments/route");
    const { PUT: ADMIN_UPDATE, DELETE: ADMIN_DELETE } = await import(
      "@/app/api/admin/appointments/[id]/route"
    );
    const { GET: ADMIN_EXPORT } = await import("@/app/api/admin/appointments/export/route");

    const submitResponse = await PUBLIC_POST(
      new Request("http://localhost/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "苏州泰可思数据科技有限公司",
          contactName: "陈先生",
          contactInfo: "13800138000",
          sourcePage: "/ai-agent/cases/digital-tax-employee",
        }),
      }),
    );

    expect(submitResponse.status).toBe(200);
    const created = (await submitResponse.json()).data as { id: string };
    expect(created.id).toBeTruthy();

    const listResponse = await ADMIN_LIST();
    expect(listResponse.status).toBe(200);
    const listJson = await listResponse.json();
    expect(Array.isArray(listJson.data)).toBe(true);
    expect(listJson.data.some((item: { id: string }) => item.id === created.id)).toBe(true);

    const updateResponse = await ADMIN_UPDATE(
      new Request(`http://localhost/api/admin/appointments/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "苏州泰可思数据科技有限公司",
          contactName: "陈先生",
          contactInfo: "service@sztaxs.com",
          sourcePage: "/contact",
          notes: "预约AI财税数字员工演示",
        }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(updateResponse.status).toBe(200);

    const exportResponse = await ADMIN_EXPORT();
    expect(exportResponse.status).toBe(200);
    const exportText = await exportResponse.text();
    expect(exportText).toContain("苏州泰可思数据科技有限公司");
    expect(exportText).toContain("预约AI财税数字员工演示");

    const deleteResponse = await ADMIN_DELETE(
      new Request(`http://localhost/api/admin/appointments/${created.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(deleteResponse.status).toBe(200);
  });

  it("rejects invalid public payload", async () => {
    const { POST: PUBLIC_POST } = await import("@/app/api/public/appointments/route");

    const response = await PUBLIC_POST(
      new Request("http://localhost/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "",
          contactName: "",
          contactInfo: "",
        }),
      }),
    );

    expect(response.status).toBe(422);
  });
});
