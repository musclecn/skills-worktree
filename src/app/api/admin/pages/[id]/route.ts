import { fail, ok } from "@/lib/api";
import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const data = await prisma.page.findUnique({ where: { id } });
  if (!data) return fail("Not found", 404);
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const data = await prisma.page.update({
    where: { id },
    data: {
      pageKey: body?.pageKey ? String(body.pageKey) : undefined,
      slug: body?.slug ? String(body.slug) : undefined,
      titleZh: body?.titleZh ? String(body.titleZh) : undefined,
      titleEn: body?.titleEn ? String(body.titleEn) : undefined,
      summaryZh: body?.summaryZh !== undefined ? String(body.summaryZh ?? "") : undefined,
      summaryEn: body?.summaryEn !== undefined ? String(body.summaryEn ?? "") : undefined,
      contentZh: body?.contentZh !== undefined ? String(body.contentZh ?? "") : undefined,
      contentEn: body?.contentEn !== undefined ? String(body.contentEn ?? "") : undefined,
      blocks: body?.blocks !== undefined ? body.blocks : undefined,
      publishStatus: body?.publishStatus ? (body.publishStatus as PublishStatus) : undefined,
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
  await prisma.page.delete({ where: { id } });
  return ok({ deleted: true });
}
