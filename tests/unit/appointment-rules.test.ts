import { describe, expect, it } from "vitest";
import { articleSlugFromPath, isProductPath, normalizeSiteEvent } from "@/lib/analytics";
import {
  classifyContact,
  normalizeAppointmentAttribution,
  normalizeAppointmentInput,
  normalizeCompany,
  normalizeContact,
  topicFromPath,
  validateAppointmentInput,
} from "@/lib/appointment";
import { deviceClassFromUserAgent, isBotUserAgent, mergeFlags } from "@/lib/appointment-guard";

describe("contact normalization", () => {
  it("treats differently formatted phone numbers as the same contact", () => {
    expect(normalizeContact("138 0013 8000")).toBe("13800138000");
    expect(normalizeContact("+86-138-0013-8000")).toBe("13800138000");
    expect(normalizeContact("１３８００１３８０００")).toBe("13800138000");
    expect(normalizeContact(" Sales@Example.COM ")).toBe("sales@example.com");
  });

  it("classifies mobile, landline, email and free text", () => {
    expect(classifyContact("13800138000")).toBe("mobile");
    expect(classifyContact("(0512)62880577")).toBe("phone");
    expect(classifyContact("+44 20 7946 0958")).toBe("phone");
    expect(classifyContact("service@sztaxs.com")).toBe("email");
    expect(classifyContact("微信 abc")).toBe("other");
  });

  it("normalizes company names for one-lead-per-company counting", () => {
    expect(normalizeCompany("苏州泰可思数据科技有限公司 ")).toBe(normalizeCompany("苏州泰可思数据科技 有限公司"));
    expect(normalizeCompany("ACME（中国）")).toBe(normalizeCompany("acme(中国)"));
  });
});

describe("appointment validation", () => {
  const base = { companyName: "测试公司", contactName: "张三", contactInfo: "13800138000" };

  it("requires a real phone or email on the public form only", () => {
    const input = normalizeAppointmentInput({ ...base, contactInfo: "随便写写" });
    expect(validateAppointmentInput(input, { strictContact: true })).toBe("请填写正确的手机号，或填写电话、邮箱");
    expect(validateAppointmentInput(input)).toBeNull();
  });

  it("returns english messages for the english page", () => {
    const input = normalizeAppointmentInput({ ...base, companyName: "x".repeat(121) });
    expect(validateAppointmentInput(input, { locale: "en" })).toBe("Company name must be 120 characters or fewer.");
    expect(validateAppointmentInput(input, { locale: "zh" })).toBe("公司名称长度不能超过120个字符");
  });

  it("keeps only known topics", () => {
    expect(normalizeAppointmentInput({ ...base, topic: "leqi" }).topic).toBe("leqi");
    expect(normalizeAppointmentInput({ ...base, topic: "<script>" }).topic).toBeNull();
  });

  it("suggests a topic from the last product page", () => {
    expect(topicFromPath("/products/leqi-access-platform")).toBe("leqi");
    expect(topicFromPath("/products/tax-risk-governance")).toBe("risk");
    expect(topicFromPath("/ai-agent/cases/digital-tax-employee")).toBe("ai-agent");
    expect(topicFromPath("/products/global-tax-intelligence-platform")).toBe("overseas");
    expect(topicFromPath("/about")).toBe("");
  });

  it("sanitizes attribution fields", () => {
    const attribution = normalizeAppointmentAttribution({
      sessionId: "abcdef1234567890",
      landingPath: "/news/some-article?utm_source=x",
      prevPath: "https://evil.example/",
      articleSlug: "2026-09-29-sinopec-pay-and-invoice-first-batch",
      productPath: "//evil.example",
      entryId: "product-bottom",
      referrerHost: "www.baidu.com",
      submissionId: "short",
    });
    expect(attribution.sessionId).toBe("abcdef1234567890");
    expect(attribution.landingPath).toBe("/news/some-article");
    expect(attribution.prevPath).toBeNull();
    expect(attribution.productPath).toBeNull();
    expect(attribution.entryId).toBe("product-bottom");
    expect(attribution.referrerHost).toBe("www.baidu.com");
    expect(attribution.submissionId).toBeNull();
  });
});

describe("guards and events", () => {
  it("detects bots and device classes", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Baiduspider/2.0)")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1")).toBe(false);
    expect(deviceClassFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari")).toBe("mobile");
    expect(deviceClassFromUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131")).toBe("desktop");
  });

  it("merges anomaly flags without duplicates", () => {
    expect(mergeFlags(null, "BURST")).toBe("BURST");
    expect(mergeFlags("DUPLICATE_24H", "BURST")).toBe("DUPLICATE_24H,BURST");
    expect(mergeFlags("BURST", "BURST")).toBe("BURST");
  });

  it("accepts well-formed events and rejects the rest", () => {
    const event = normalizeSiteEvent({
      sessionId: "abcdef1234567890",
      type: "entry_click",
      path: "/en/news/some-article?x=1",
      target: "/solutions/leqi-joint-use-solution",
      entryId: "news-related",
      articleSlug: "some-article",
      contactInfo: "13800138000",
    });
    expect(event).toEqual({
      sessionId: "abcdef1234567890",
      type: "entry_click",
      path: "/en/news/some-article",
      locale: "en",
      target: "/solutions/leqi-joint-use-solution",
      entryId: "news-related",
      articleSlug: "some-article",
      referrerHost: null,
    });
    expect(normalizeSiteEvent({ sessionId: "abcdef1234567890", type: "unknown", path: "/" })).toBeNull();
    expect(normalizeSiteEvent({ sessionId: "x", type: "page_view", path: "/" })).toBeNull();
    expect(normalizeSiteEvent({ sessionId: "abcdef1234567890", type: "page_view", path: "news" })).toBeNull();
  });

  it("classifies product pages and article slugs across languages", () => {
    expect(isProductPath("/products/leqi-access-platform")).toBe(true);
    expect(isProductPath("/en/ai-agent")).toBe(true);
    expect(isProductPath("/en/solutions/leqi-joint-use-solution")).toBe(true);
    expect(isProductPath("/news")).toBe(false);
    expect(articleSlugFromPath("/en/news/2026-09-29-sinopec")).toBe("2026-09-29-sinopec");
    expect(articleSlugFromPath("/news")).toBeNull();
  });
});

describe("historical backfill", () => {
  it("marks later same-contact rows as duplicate and a 5-minute flood as burst", async () => {
    const { planAppointmentBackfill } = await import("@/lib/appointment-backfill");
    const start = new Date("2026-08-30T02:00:00Z").getTime();
    const row = (id: string, contactInfo: string, offsetMs: number, reviewStatus = "PENDING") => ({
      id,
      contactInfo,
      createdAt: new Date(start + offsetMs),
      contactKey: null,
      anomalyFlags: null,
      reviewStatus,
    });

    // 3 个联系方式在 3 分半内共提交 12 条，另有一条两天后的正常提交。
    const flood = Array.from({ length: 12 }, (_, index) =>
      row(`flood-${index}`, ["13800000001", "138 0000 0002", "a@example.com"][index % 3], index * 17_000),
    );
    const later = row("later", "13800000009", 2 * 24 * 60 * 60 * 1000);
    const reviewed = row("reviewed", "13800000001", 60 * 60 * 1000, "VALID");

    const updates = planAppointmentBackfill([...flood, later, reviewed]);
    const byId = new Map(updates.map((item) => [item.id, item]));

    expect(flood.every((item) => byId.get(item.id)?.anomalyFlags?.includes("BURST"))).toBe(true);
    // 每个联系方式只保留最早一条
    expect(flood.filter((item) => byId.get(item.id)?.reviewStatus === "DUPLICATE")).toHaveLength(9);
    expect(byId.get("flood-0")?.reviewStatus).toBe("PENDING");
    // 两天后的正常提交不带任何标记
    expect(byId.get("later")?.anomalyFlags).toBeNull();
    expect(byId.get("later")?.reviewStatus).toBe("PENDING");
    // 已人工复核的结论不被覆盖，但仍补上重复标记
    expect(byId.get("reviewed")?.reviewStatus).toBe("VALID");
    expect(byId.get("reviewed")?.anomalyFlags).toContain("DUPLICATE_24H");
    expect(new Set(updates.map((item) => item.contactKey)).size).toBe(4);
  });
});
