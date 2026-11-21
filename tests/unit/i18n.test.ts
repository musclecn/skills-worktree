import { describe, expect, it } from "vitest";
import { localizePath, normalizeLocale, pickLocalized } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("normalizes language to zh/en", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("zh")).toBe("zh");
    expect(normalizeLocale("unknown")).toBe("zh");
    expect(normalizeLocale(null)).toBe("zh");
  });

  it("falls back to zh when en content is missing", () => {
    const row = {
      titleZh: "中文标题",
      titleEn: "",
    };
    expect(pickLocalized(row, "en", "titleZh", "titleEn")).toBe("中文标题");
  });

  it("maps localized paths", () => {
    expect(localizePath("zh", "/news")).toBe("/news");
    expect(localizePath("en", "/")).toBe("/en");
    expect(localizePath("en", "/news")).toBe("/en/news");
  });
});

describe("language switch target", () => {
  it("keeps the same content when switching from zh to en", async () => {
    const { getAlternateHref } = await import("@/lib/i18n");
    expect(getAlternateHref("zh", "/news/2026-09-16-guizhou-qixing-tax-brain-ai")).toBe(
      "/en/news/2026-09-16-guizhou-qixing-tax-brain-ai",
    );
    expect(getAlternateHref("zh", "/products/leqi-access-platform")).toBe("/en/products/leqi-access-platform");
    expect(getAlternateHref("zh", "/contact")).toBe("/en/contact");
    expect(getAlternateHref("zh", "/")).toBe("/en");
  });

  it("keeps the same content when switching from en back to zh", async () => {
    const { getAlternateHref } = await import("@/lib/i18n");
    expect(getAlternateHref("en", "/en/news/2026-09-16-guizhou-qixing-tax-brain-ai")).toBe(
      "/news/2026-09-16-guizhou-qixing-tax-brain-ai",
    );
    expect(getAlternateHref("en", "/en")).toBe("/");
    expect(getAlternateHref("en", "/en/privacy")).toBe("/privacy");
  });

  it("preserves the news category filter and drops other params", async () => {
    const { getAlternateHref } = await import("@/lib/i18n");
    expect(getAlternateHref("zh", "/news", "category=industry")).toBe("/en/news?category=industry");
    expect(getAlternateHref("en", "/en/news", new URLSearchParams("category=COMPANY&notice=untranslated"))).toBe(
      "/news?category=company",
    );
    expect(getAlternateHref("zh", "/news", "category=unknown&utm_source=x")).toBe("/en/news");
  });

  it("falls back to the zh home page for english-only pages", async () => {
    const { getAlternateHref } = await import("@/lib/i18n");
    expect(getAlternateHref("en", "/en/export-sales-reconciliation")).toBe("/");
  });

  it("derives the html lang from the pathname", async () => {
    const { localeFromPathname } = await import("@/lib/i18n");
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/en/news")).toBe("en");
    expect(localeFromPathname("/enterprise")).toBe("zh");
    expect(localeFromPathname("/news")).toBe("zh");
  });
});
