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
