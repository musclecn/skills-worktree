import { UserRole } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createTempDatabaseUrl, setupDatabase } from "../helpers/db";

const notify = vi.fn().mockResolvedValue({ skipped: false });
const burstAlert = vi.fn().mockResolvedValue({ skipped: false });

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function submitRequest(body: Record<string, unknown>, ip = "203.0.113.10") {
  return new Request("http://localhost/api/public/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip, "user-agent": BROWSER_UA },
    body: JSON.stringify(body),
  });
}

describe.sequential("appointment protection and attribution", () => {
  let databaseUrl = "";

  beforeAll(() => {
    databaseUrl = createTempDatabaseUrl("sztaxs-appointment-protection");
    process.env.DATABASE_URL = databaseUrl;
    setupDatabase(databaseUrl);
  });

  beforeEach(async () => {
    vi.resetModules();
    notify.mockClear();
    burstAlert.mockClear();
    vi.doMock("@/lib/appointment-email", () => ({
      sendAppointmentNotification: notify,
      sendAppointmentBurstAlert: burstAlert,
    }));
    vi.doMock("@/lib/auth/guard", () => ({
      requireRole: vi.fn().mockResolvedValue({
        user: { id: "admin-user-id", email: "admin@sztaxs.com", name: "Admin", role: UserRole.ADMIN },
      }),
    }));
    const { prisma } = await import("@/lib/prisma");
    await prisma.appointmentRequest.deleteMany();
    await prisma.siteEvent.deleteMany();
  });

  afterAll(() => {
    vi.doUnmock("@/lib/appointment-email");
    vi.doUnmock("@/lib/auth/guard");
    cleanupDatabase(databaseUrl);
  });

  it("stores the source chain and notifies once (A1)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");

    const response = await POST(
      submitRequest({
        companyName: "测试企业一",
        contactName: "王工",
        contactInfo: "138 0013 8001",
        topic: "leqi",
        locale: "zh",
        sourcePage: "/contact",
        sessionId: "session-aaaaaaaa",
        landingPath: "/news/2026-09-29-sinopec-pay-and-invoice-first-batch",
        referrerHost: "www.baidu.com",
        prevPath: "/solutions/leqi-joint-use-solution",
        articleSlug: "2026-09-29-sinopec-pay-and-invoice-first-batch",
        productPath: "/solutions/leqi-joint-use-solution",
        entryId: "solution-bottom",
        submissionId: "submission-0001",
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.duplicate).toBe(false);
    // 响应不回传联系资料
    expect(JSON.stringify(json)).not.toContain("13800138001");

    const row = await prisma.appointmentRequest.findUniqueOrThrow({ where: { id: json.data.id } });
    expect(row.topic).toBe("leqi");
    expect(row.locale).toBe("zh");
    expect(row.sessionId).toBe("session-aaaaaaaa");
    expect(row.articleSlug).toBe("2026-09-29-sinopec-pay-and-invoice-first-batch");
    expect(row.productPath).toBe("/solutions/leqi-joint-use-solution");
    expect(row.entryId).toBe("solution-bottom");
    expect(row.referrerHost).toBe("www.baidu.com");
    expect(row.deviceClass).toBe("desktop");
    expect(row.reviewStatus).toBe("PENDING");
    expect(row.anomalyFlags).toBeNull();
    // 库内只存 IP 的哈希
    expect(row.ipHash).toBeTruthy();
    expect(row.ipHash).not.toContain("203.0.113");
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("is idempotent for retries of the same submission", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");
    const body = {
      companyName: "测试企业二",
      contactName: "李工",
      contactInfo: "13800138002",
      submissionId: "submission-retry-01",
    };

    const first = await (await POST(submitRequest(body))).json();
    const second = await (await POST(submitRequest(body))).json();
    expect(second.data.id).toBe(first.data.id);
    expect(await prisma.appointmentRequest.count()).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("flags the same contact within 24 hours as duplicate without notifying again (A2)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");

    await POST(submitRequest({ companyName: "测试企业三", contactName: "赵工", contactInfo: "13800138003" }, "203.0.113.21"));
    const second = await POST(
      submitRequest({ companyName: "测试企业三", contactName: "赵工", contactInfo: "+86 138-0013-8003" }, "203.0.113.22"),
    );
    expect(second.status).toBe(200);
    expect((await second.json()).data.duplicate).toBe(true);

    const rows = await prisma.appointmentRequest.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => row.reviewStatus)).toEqual(["PENDING", "DUPLICATE"]);
    expect(rows[1].anomalyFlags).toContain("DUPLICATE_24H");
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("rate limits the sixth submission from one IP within ten minutes (A3)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const ip = "203.0.113.30";

    for (let index = 0; index < 5; index += 1) {
      const ok = await POST(
        submitRequest({ companyName: `限流测试${index}`, contactName: "测试", contactInfo: `1390000000${index}` }, ip),
      );
      expect(ok.status).toBe(200);
    }

    const blockedZh = await POST(
      submitRequest({ companyName: "限流测试6", contactName: "测试", contactInfo: "13900000009" }, ip),
    );
    expect(blockedZh.status).toBe(429);
    expect((await blockedZh.json()).message).toContain("提交过于频繁");

    const blockedEn = await POST(
      submitRequest({ companyName: "Rate limit", contactName: "Tester", contactInfo: "tester@example.com", locale: "en" }, ip),
    );
    expect(blockedEn.status).toBe(429);
    expect((await blockedEn.json()).message).toContain("Too many submissions");
  });

  it("flags a burst as a whole batch and alerts exactly once (A4)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");

    for (let index = 0; index < 14; index += 1) {
      const response = await POST(
        submitRequest(
          { companyName: `突发测试${index}`, contactName: "测试", contactInfo: `137000000${String(index).padStart(2, "0")}` },
          `198.51.100.${index + 1}`,
        ),
      );
      expect(response.status).toBe(200);
    }

    const rows = await prisma.appointmentRequest.findMany();
    expect(rows).toHaveLength(14);
    expect(rows.every((row) => (row.anomalyFlags ?? "").includes("BURST"))).toBe(true);
    expect(burstAlert).toHaveBeenCalledTimes(1);
    // 阈值之前的 9 条逐条通知，突发开始后不再通知
    expect(notify).toHaveBeenCalledTimes(9);
  });

  it("rejects free-text contact details and answers in the page language (A7)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");

    const zh = await POST(submitRequest({ companyName: "测试", contactName: "测试", contactInfo: "加我微信" }));
    expect(zh.status).toBe(422);
    expect((await zh.json()).message).toBe("请填写正确的手机号，或填写电话、邮箱");

    const en = await POST(
      submitRequest({ companyName: "x".repeat(121), contactName: "Tester", contactInfo: "tester@example.com", locale: "en" }),
    );
    expect(en.status).toBe(422);
    expect((await en.json()).message).toBe("Company name must be 120 characters or fewer.");
  });

  it("silently drops honeypot submissions", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");

    const response = await POST(
      submitRequest({ companyName: "机器人", contactName: "bot", contactInfo: "13800138009", website: "http://spam.example" }),
    );
    expect(response.status).toBe(200);
    expect(await prisma.appointmentRequest.count()).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("accepts native form posts without page scripts and redirects back without contact details", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { prisma } = await import("@/lib/prisma");
    const formRequest = (fields: Record<string, string>, ip: string) =>
      new Request("http://localhost/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "x-real-ip": ip, "user-agent": BROWSER_UA },
        body: new URLSearchParams(fields).toString(),
      });

    const ok = await POST(
      formRequest(
        {
          locale: "zh",
          sourcePage: "/contact",
          entryId: "native-form",
          companyName: "无脚本测试公司",
          contactName: "钱工",
          contactInfo: "13800138020",
          topic: "archive",
          website: "",
        },
        "203.0.113.60",
      ),
    );
    expect(ok.status).toBe(303);
    const location = ok.headers.get("location") ?? "";
    expect(location).toBe("/contact?appointment=submitted#appointment-form");
    expect(location).not.toContain("13800138020");
    const row = await prisma.appointmentRequest.findFirstOrThrow({ where: { companyName: "无脚本测试公司" } });
    expect(row).toMatchObject({ entryId: "native-form", sourcePage: "/contact", topic: "archive", locale: "zh", reviewStatus: "PENDING" });
    expect(notify).toHaveBeenCalledTimes(1);

    const invalid = await POST(formRequest({ locale: "zh", companyName: "", contactName: "", contactInfo: "" }, "203.0.113.61"));
    expect(invalid.status).toBe(303);
    expect(invalid.headers.get("location")).toBe("/contact?appointment=invalid#appointment-form");

    const en = await POST(
      formRequest({ locale: "en", companyName: "Acme", contactName: "Tester", contactInfo: "not a phone" }, "203.0.113.62"),
    );
    expect(en.headers.get("location")).toBe("/en/contact?appointment=invalid#appointment-form");
  });

  it("lets staff set the review status and reports aggregates without contact details (A10)", async () => {
    const { POST } = await import("@/app/api/public/appointments/route");
    const { PUT } = await import("@/app/api/admin/appointments/[id]/route");
    const { GET: SUMMARY } = await import("@/app/api/admin/analytics/summary/route");
    const { POST: EVENTS } = await import("@/app/api/public/events/route");
    const { prisma } = await import("@/lib/prisma");

    const created = await (
      await POST(
        submitRequest({
          companyName: "有效线索公司",
          contactName: "周经理",
          contactInfo: "13800138010",
          topic: "risk",
          sessionId: "session-bbbbbbbb",
          articleSlug: "some-article",
          productPath: "/products/tax-risk-governance",
          entryId: "product-bottom",
        }),
      )
    ).json();

    const updated = await PUT(
      new Request(`http://localhost/api/admin/appointments/${created.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "有效线索公司",
          contactName: "周经理",
          contactInfo: "13800138010",
          topic: "risk",
          reviewStatus: "VALID",
        }),
      }),
      { params: Promise.resolve({ id: created.data.id }) },
    );
    expect(updated.status).toBe(200);
    const row = await prisma.appointmentRequest.findUniqueOrThrow({ where: { id: created.data.id } });
    expect(row.reviewStatus).toBe("VALID");
    expect(row.reviewedAt).toBeInstanceOf(Date);

    const eventRequest = (events: unknown[], userAgent = BROWSER_UA) =>
      new Request("http://localhost/api/public/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-agent": userAgent, "x-forwarded-for": "203.0.113.50" },
        body: JSON.stringify({ events }),
      });
    const sid = "session-bbbbbbbb";
    const accepted = await EVENTS(
      eventRequest([
        { sessionId: sid, type: "page_view", path: "/news/some-article", articleSlug: "some-article" },
        { sessionId: sid, type: "entry_impression", path: "/news/some-article", articleSlug: "some-article", entryId: "news-related" },
        { sessionId: sid, type: "entry_click", path: "/news/some-article", articleSlug: "some-article", entryId: "news-related" },
        { sessionId: sid, type: "page_view", path: "/products/tax-risk-governance" },
        { sessionId: sid, type: "cta_click", path: "/products/tax-risk-governance", entryId: "product-bottom", target: "/contact" },
        { sessionId: "session-cccccccc", type: "page_view", path: "/products" },
        { sessionId: sid, type: "page_view", path: "not-a-path" },
        { sessionId: sid, type: "made_up", path: "/" },
      ]),
    );
    expect((await accepted.json()).data.accepted).toBe(6);

    // 机器人的事件不入库
    const bot = await EVENTS(
      eventRequest([{ sessionId: "session-dddddddd", type: "page_view", path: "/" }], "Mozilla/5.0 (compatible; Baiduspider/2.0)"),
    );
    expect((await bot.json()).data.accepted).toBe(0);
    expect(await prisma.siteEvent.count()).toBe(6);

    const summaryResponse = await SUMMARY(new Request("http://localhost/api/admin/analytics/summary"));
    expect(summaryResponse.status).toBe(200);
    const summaryText = await summaryResponse.text();
    const summary = JSON.parse(summaryText).data;

    expect(summary.relatedEntry).toMatchObject({ impressions: 1, clicks: 1, clickRate: 1 });
    expect(summary.productToBooking).toMatchObject({ productSessions: 2, bookingClickSessions: 1, clickRate: 0.5 });
    expect(summary.appointments).toMatchObject({
      rawSubmissions: 1,
      distinctContacts: 1,
      successfulSubmissions: 1,
      validLeads: 1,
      attributionFillRate: 1,
    });
    expect(summary.appointments.byTopic).toEqual([{ key: "risk", count: 1 }]);

    // 聚合结果（含 CSV 导出）不含公司名、联系人和联系方式
    const csv = await (
      await SUMMARY(new Request("http://localhost/api/admin/analytics/summary?format=csv"))
    ).text();
    for (const text of [summaryText, csv]) {
      expect(text).not.toContain("有效线索公司");
      expect(text).not.toContain("周经理");
      expect(text).not.toContain("13800138010");
    }
  });
});
