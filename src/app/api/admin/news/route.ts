import { type NewsCategory, PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

function normalizeCategory(value: unknown) {
  return (String(value ?? "").toUpperCase() === "INDUSTRY" ? "INDUSTRY" : "COMPANY") as NewsCategory;
}

/** 相关入口只接受站内路径；其他写法一律当作未配置。 */
function normalizeRelatedPath(value: unknown) {
  const path = String(value ?? "").trim().split(/[?#]/)[0];
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 200) return null;
  return path.startsWith("/en/") ? path.slice(3) : path;
}

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const data = await prisma.newsPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
  });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);

  if (!body?.slug || !body?.titleZh || !body?.titleEn || !body?.contentZh || !body?.contentEn) {
    return fail("Missing fields", 422);
  }

  const data = await prisma.newsPost.create({
    data: {
      slug: String(body.slug),
      titleZh: String(body.titleZh),
      titleEn: String(body.titleEn),
      summaryZh: body.summaryZh ? String(body.summaryZh) : null,
      summaryEn: body.summaryEn ? String(body.summaryEn) : null,
      contentZh: String(body.contentZh),
      contentEn: String(body.contentEn),
      newsCategory: normalizeCategory(body.newsCategory),
      coverUrl: body.coverUrl ? String(body.coverUrl) : null,
      sourceName: body.sourceName ? String(body.sourceName) : null,
      sourceUrl: body.sourceUrl ? String(body.sourceUrl) : null,
      externalId: body.externalId ? String(body.externalId) : null,
      relatedPath: normalizeRelatedPath(body.relatedPath),
      relatedLabelZh: body.relatedLabelZh ? String(body.relatedLabelZh).trim().slice(0, 120) : null,
      relatedLabelEn: body.relatedLabelEn ? String(body.relatedLabelEn).trim().slice(0, 160) : null,
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.PUBLISHED,
      publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : new Date(),
      sortOrder: Number(body.sortOrder ?? 0),
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.REVIEWED,
    },
  });

  return ok(data);
}
