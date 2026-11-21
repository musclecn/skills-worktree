import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [products, solutions, news, pages, appointments] = await Promise.all([
    prisma.product.count(),
    prisma.solution.count(),
    prisma.newsPost.count(),
    prisma.page.count(),
    prisma.appointmentRequest.count(),
  ]);

  return (
    <>
      <div className="admin-card">
        <h2>系统概览</h2>
        <div className="grid">
          <article className="card">
            <h3>产品</h3>
            <p>{products}</p>
          </article>
          <article className="card">
            <h3>解决方案</h3>
            <p>{solutions}</p>
          </article>
          <article className="card">
            <h3>新闻</h3>
            <p>{news}</p>
          </article>
          <article className="card">
            <h3>页面</h3>
            <p>{pages}</p>
          </article>
          <article className="card">
            <h3>预约</h3>
            <p>{appointments}</p>
          </article>
        </div>
      </div>

      <div className="admin-card">
        <h2>使用说明</h2>
        <p style={{ lineHeight: 1.8, color: "var(--muted)" }}>
          推荐先完成“站点配置”和“菜单管理”，再依次维护产品、方案、新闻和页面内容。英文内容可在编辑后调用翻译 API 自动生成草稿。
        </p>
      </div>
    </>
  );
}
