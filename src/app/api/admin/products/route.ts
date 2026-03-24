import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const data = await prisma.product.findMany({
    include: {
      category: true,
      sections: {
        include: { items: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.nameZh || !body?.nameEn || !body?.categoryId) {
    return fail("Missing fields", 422);
  }

  const sections = Array.isArray(body.sections) ? body.sections : [];
  const galleryImages = Array.isArray(body.galleryImages)
    ? body.galleryImages
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const data = await prisma.product.create({
    data: {
      categoryId: String(body.categoryId),
      slug: String(body.slug),
      nameZh: String(body.nameZh),
      nameEn: String(body.nameEn),
      summaryZh: body.summaryZh ? String(body.summaryZh) : null,
      summaryEn: body.summaryEn ? String(body.summaryEn) : null,
      bannerUrl: body.bannerUrl ? String(body.bannerUrl) : null,
      galleryImages: galleryImages.length > 0 ? galleryImages : [],
      sortOrder: Number(body.sortOrder ?? 0),
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.PUBLISHED,
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.REVIEWED,
      sections: {
        create: sections.map((section: Record<string, unknown>, sectionIndex: number) => ({
          sectionType: String(section.sectionType ?? "feature"),
          titleZh: String(section.titleZh ?? ""),
          titleEn: String(section.titleEn ?? ""),
          descriptionZh:
            section.descriptionZh !== undefined ? String(section.descriptionZh ?? "") : null,
          descriptionEn:
            section.descriptionEn !== undefined ? String(section.descriptionEn ?? "") : null,
          imageUrl: section.imageUrl ? String(section.imageUrl) : null,
          sortOrder: Number(section.sortOrder ?? sectionIndex),
          items: {
            create: Array.isArray(section.items)
              ? (section.items as Record<string, unknown>[]).map((item, itemIndex) => ({
                  titleZh: item.titleZh ? String(item.titleZh) : null,
                  titleEn: item.titleEn ? String(item.titleEn) : null,
                  descriptionZh: String(item.descriptionZh ?? ""),
                  descriptionEn: String(item.descriptionEn ?? ""),
                  iconUrl: item.iconUrl ? String(item.iconUrl) : null,
                  sortOrder: Number(item.sortOrder ?? itemIndex),
                }))
              : [],
          },
        })),
      },
    },
    include: {
      sections: { include: { items: true } },
    },
  });

  return ok(data);
}
