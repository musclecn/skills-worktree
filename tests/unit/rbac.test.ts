import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

import { getSessionUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/guard";

describe("RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const result = await requireRole([UserRole.ADMIN]);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("returns 403 when role is not allowed", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "u1",
      email: "editor@sztaxs.com",
      name: "Editor",
      role: UserRole.EDITOR,
    });

    const result = await requireRole([UserRole.ADMIN]);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("passes when user role matches", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "u2",
      email: "admin@sztaxs.com",
      name: "Admin",
      role: UserRole.ADMIN,
    });

    const result = await requireRole([UserRole.ADMIN]);
    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user.role).toBe(UserRole.ADMIN);
    }
  });
});
