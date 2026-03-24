import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const data = await prisma.product.findUnique({
    where: { id },
    include: {
      sections: {
        include: { items: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const sections = Array.isArray(body?.sections) ? body.sections : null;
  const galleryImages = Array.isArray(body?.galleryImages)
    ? body.galleryImages
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : null;

  const data = await prisma.$transaction(async (tx) => {
    if (sections) {
      await tx.productSectionItem.deleteMany({
        where: { section: { productId: id } },
      });
      await tx.productSection.deleteMany({ where: { productId: id } });
    }

    const updated = await tx.product.update({
      where: { id },
      data: {
        categoryId: body?.categoryId ? String(body.categoryId) : undefined,
        slug: body?.slug ? String(body.slug) : undefined,
        nameZh: body?.nameZh ? String(body.nameZh) : undefined,
        nameEn: body?.nameEn ? String(body.nameEn) : undefined,
        summaryZh: body?.summaryZh !== undefined ? String(body.summaryZh ?? "") : undefined,
        summaryEn: body?.summaryEn !== undefined ? String(body.summaryEn ?? "") : undefined,
        bannerUrl:
          body?.bannerUrl !== undefined
            ? body.bannerUrl
              ? String(body.bannerUrl)
              : null
            : undefined,
        galleryImages: galleryImages !== null ? (galleryImages.length > 0 ? galleryImages : []) : undefined,
        sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        publishStatus: body?.publishStatus ? (body.publishStatus as PublishStatus) : undefined,
        translationStatus: body?.translationStatus
          ? (body.translationStatus as TranslationStatus)
          : undefined,
      },
    });

    if (sections) {
      for (let i = 0; i < sections.length; i += 1) {
        const section = sections[i] as Record<string, unknown>;
        const createdSection = await tx.productSection.create({
          data: {
            productId: id,
            sectionType: String(section.sectionType ?? "feature"),
            titleZh: String(section.titleZh ?? ""),
            titleEn: String(section.titleEn ?? ""),
            descriptionZh:
              section.descriptionZh !== undefined ? String(section.descriptionZh ?? "") : null,
            descriptionEn:
              section.descriptionEn !== undefined ? String(section.descriptionEn ?? "") : null,
            imageUrl: section.imageUrl ? String(section.imageUrl) : null,
            sortOrder: Number(section.sortOrder ?? i),
          },
        });

        const items = Array.isArray(section.items) ? (section.items as Record<string, unknown>[]) : [];
        if (items.length > 0) {
          await tx.productSectionItem.createMany({
            data: items.map((item, index) => ({
              sectionId: createdSection.id,
              titleZh: item.titleZh ? String(item.titleZh) : null,
              titleEn: item.titleEn ? String(item.titleEn) : null,
              descriptionZh: String(item.descriptionZh ?? ""),
              descriptionEn: String(item.descriptionEn ?? ""),
              iconUrl: item.iconUrl ? String(item.iconUrl) : null,
              sortOrder: Number(item.sortOrder ?? index),
            })),
          });
        }
      }
    }

    return updated;
  });

  return ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return ok({ deleted: true });
}
