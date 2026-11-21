import { UserRole } from "@prisma/client";
import { ok } from "@/lib/api";
import { buildAnalyticsSummary, resolveSummaryRange, summaryToCsv } from "@/lib/analytics-summary";
import { requireRole } from "@/lib/auth/guard";

/** 访问与预约的聚合统计。只返回数量，不含公司名、联系人和联系方式。 */
export async function GET(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const { from, toExclusive } = resolveSummaryRange(url.searchParams.get("from"), url.searchParams.get("to"));
  const summary = await buildAnalyticsSummary(from, toExclusive);

  if (url.searchParams.get("format") === "csv") {
    return new Response(summaryToCsv(summary), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-summary-${summary.range.from}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return ok(summary);
}
