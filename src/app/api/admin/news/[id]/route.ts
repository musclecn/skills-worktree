import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

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
      titleZh: body?.titleZh ? String(body.titleZh) : undefined,
      titleEn: body?.titleEn ? String(body.titleEn) : undefined,
      summaryZh: body?.summaryZh !== undefined ? String(body.summaryZh ?? "") : undefined,
      summaryEn: body?.summaryEn !== undefined ? String(body.summaryEn ?? "") : undefined,
      contentZh: body?.contentZh ? String(body.contentZh) : undefined,
      contentEn: body?.contentEn ? String(body.contentEn) : undefined,
      coverUrl: body?.coverUrl !== undefined ? String(body.coverUrl ?? "") : undefined,
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
