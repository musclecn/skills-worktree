import { TranslationStatus, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guard", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/translation", () => ({
  translateToEnglish: vi.fn(),
}));

import { requireRole } from "@/lib/auth/guard";
import { translateToEnglish } from "@/lib/translation";
import { POST } from "@/app/api/admin/translate/route";

describe("POST /api/admin/translate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue({
      user: {
        id: "u1",
        email: "admin@sztaxs.com",
        name: "Admin",
        role: UserRole.ADMIN,
      },
    });
  });

  it("returns translated text and MACHINE_TRANSLATED status", async () => {
    vi.mocked(translateToEnglish).mockResolvedValue("Hello");

    const response = await POST(
      new Request("http://localhost/api/admin/translate", {
        method: "POST",
        body: JSON.stringify({ text: "你好" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.translatedText).toBe("Hello");
    expect(body.data.translationStatus).toBe(TranslationStatus.MACHINE_TRANSLATED);
  });

  it("returns 422 when text is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/translate", {
        method: "POST",
        body: JSON.stringify({ text: "" }),
      }),
    );

    expect(response.status).toBe(422);
  });
});
