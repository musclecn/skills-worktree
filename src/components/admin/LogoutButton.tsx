"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button className="secondary" type="button" onClick={handleLogout}>
      退出登录
    </button>
  );
}
