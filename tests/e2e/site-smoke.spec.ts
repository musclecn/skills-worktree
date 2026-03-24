import { expect, test } from "@playwright/test";

test("public home and admin login page can load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "产品中心" })).toBeVisible();

  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "后台登录" })).toBeVisible();
});
