import { UserRole } from "@prisma/client";
import { REVIEW_STATUS_LABELS, isReviewStatus, topicLabel } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function formatDateTime(value: Date) {
  const iso = value.toISOString();
  return iso.replace("T", " ").slice(0, 19);
}

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const rows = await prisma.appointmentRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  const header = [
    "ID",
    "公司名称",
    "联系人",
    "联系方式",
    "来源页面",
    "备注",
    "提交时间",
    "更新时间",
    "咨询方向",
    "复核状态",
    "异常标记",
    "页面语言",
    "外部来源",
    "落地页",
    "来源文章",
    "最近产品",
    "上一页",
    "预约入口",
  ];
  const lines = [
    header.map((item) => escapeCsv(item)).join(","),
    ...rows.map((item) =>
      [
        item.id,
        item.companyName,
        item.contactName,
        item.contactInfo,
        item.sourcePage ?? "",
        item.notes ?? "",
        formatDateTime(item.createdAt),
        formatDateTime(item.updatedAt),
        topicLabel(item.topic),
        isReviewStatus(item.reviewStatus) ? REVIEW_STATUS_LABELS[item.reviewStatus] : item.reviewStatus,
        item.anomalyFlags ?? "",
        item.locale ?? "",
        item.referrerHost ?? "",
        item.landingPath ?? "",
        item.articleSlug ?? "",
        item.productPath ?? "",
        item.prevPath ?? "",
        item.entryId ?? "",
      ]
        .map((cell) => escapeCsv(cell))
        .join(","),
    ),
  ];

  const fileDate = new Date().toISOString().slice(0, 10);
  const csvText = `\uFEFF${lines.join("\n")}`;

  return new Response(csvText, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"appointments-${fileDate}.csv\"`,
      "Cache-Control": "no-store",
    },
  });
}
