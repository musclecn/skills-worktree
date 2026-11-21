import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-aside">
        <h1>泰可思CMS</h1>
        <nav>
          <Link href="/admin">控制台</Link>
          <Link href="/admin/site">站点配置</Link>
          <Link href="/admin/menus">菜单管理</Link>
          <Link href="/admin/pages">页面管理</Link>
          <Link href="/admin/products">产品管理</Link>
          <Link href="/admin/solutions">方案管理</Link>
          <Link href="/admin/news">新闻管理</Link>
          <Link href="/admin/appointments">预约管理</Link>
          <Link href="/admin/analytics">访问统计</Link>
          <Link href="/admin/short-videos">视频管理</Link>
          <Link href="/admin/media">媒体库</Link>
          {user.role === "ADMIN" ? <Link href="/admin/users">用户管理</Link> : null}
        </nav>
      </aside>
      <section className="admin-main">
        <div className="admin-card" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div className="badge">{user.role}</div>
            <h2 style={{ marginTop: 8 }}>{user.name}</h2>
            <p style={{ color: "var(--muted)" }}>{user.email}</p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
