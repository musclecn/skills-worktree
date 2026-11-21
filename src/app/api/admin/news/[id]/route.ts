import { type NewsCategory, PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { ok } from "@/lib/api";
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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const data = await prisma.newsPost.findUnique({ where: { id } });
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const data = await prisma.newsPost.update({
    where: { id },
    data: {
      slug: body?.slug ? String(body.slug) : undefined,
      newsCategory: body?.newsCategory !== undefined ? normalizeCategory(body.newsCategory) : undefined,
      titleZh: body?.titleZh ? String(body.titleZh) : undefined,
      titleEn: body?.titleEn ? String(body.titleEn) : undefined,
      summaryZh:
        body?.summaryZh !== undefined ? (body.summaryZh ? String(body.summaryZh) : null) : undefined,
      summaryEn:
        body?.summaryEn !== undefined ? (body.summaryEn ? String(body.summaryEn) : null) : undefined,
      contentZh: body?.contentZh ? String(body.contentZh) : undefined,
      contentEn: body?.contentEn ? String(body.contentEn) : undefined,
      coverUrl: body?.coverUrl !== undefined ? (body.coverUrl ? String(body.coverUrl) : null) : undefined,
      sourceName:
        body?.sourceName !== undefined ? (body.sourceName ? String(body.sourceName) : null) : undefined,
      sourceUrl:
        body?.sourceUrl !== undefined ? (body.sourceUrl ? String(body.sourceUrl) : null) : undefined,
      externalId:
        body?.externalId !== undefined ? (body.externalId ? String(body.externalId) : null) : undefined,
      relatedPath: body?.relatedPath !== undefined ? normalizeRelatedPath(body.relatedPath) : undefined,
      relatedLabelZh:
        body?.relatedLabelZh !== undefined
          ? body.relatedLabelZh
            ? String(body.relatedLabelZh).trim().slice(0, 120)
            : null
          : undefined,
      relatedLabelEn:
        body?.relatedLabelEn !== undefined
          ? body.relatedLabelEn
            ? String(body.relatedLabelEn).trim().slice(0, 160)
            : null
          : undefined,
      publishStatus: body?.publishStatus ? (body.publishStatus as PublishStatus) : undefined,
      sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      publishedAt: body?.publishedAt ? new Date(String(body.publishedAt)) : undefined,
      translationStatus: body?.translationStatus
        ? (body.translationStatus as TranslationStatus)
        : undefined,
    },
  });

  return ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.newsPost.delete({ where: { id } });
  return ok({ deleted: true });
}
