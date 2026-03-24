import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const data = await prisma.productCategory.findUnique({ where: { id } });
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const data = await prisma.productCategory.update({
    where: { id },
    data: {
      slug: body?.slug ? String(body.slug) : undefined,
      nameZh: body?.nameZh ? String(body.nameZh) : undefined,
      nameEn: body?.nameEn ? String(body.nameEn) : undefined,
      descriptionZh: body?.descriptionZh !== undefined ? String(body.descriptionZh ?? "") : undefined,
      descriptionEn: body?.descriptionEn !== undefined ? String(body.descriptionEn ?? "") : undefined,
      iconUrl: body?.iconUrl !== undefined ? String(body.iconUrl ?? "") : undefined,
      tabIconUrl: body?.tabIconUrl !== undefined ? String(body.tabIconUrl ?? "") : undefined,
      sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
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
  await prisma.productCategory.delete({ where: { id } });
  return ok({ deleted: true });
}
