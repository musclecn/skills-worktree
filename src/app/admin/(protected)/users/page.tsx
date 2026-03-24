import { redirect } from "next/navigation";
import { SimpleCrudManager } from "@/components/admin/SimpleCrudManager";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <SimpleCrudManager
      title="用户管理"
      endpoint="/api/admin/users"
      fields={[
        { key: "name", label: "姓名" },
        { key: "email", label: "邮箱" },
        { key: "password", label: "密码" },
        { key: "role", label: "角色", type: "select", options: ["ADMIN", "EDITOR"] },
      ]}
      defaults={{ role: "EDITOR" }}
    />
  );
}
