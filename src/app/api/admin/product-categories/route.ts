import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const data = await prisma.productCategory.findMany({
    include: { products: true },
    orderBy: { sortOrder: "asc" },
  });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.nameZh || !body?.nameEn) {
    return fail("Missing fields", 422);
  }

  const data = await prisma.productCategory.create({
    data: {
      slug: String(body.slug),
      nameZh: String(body.nameZh),
      nameEn: String(body.nameEn),
      descriptionZh: body.descriptionZh ? String(body.descriptionZh) : null,
      descriptionEn: body.descriptionEn ? String(body.descriptionEn) : null,
      iconUrl: body.iconUrl ? String(body.iconUrl) : null,
      tabIconUrl: body.tabIconUrl ? String(body.tabIconUrl) : null,
      sortOrder: Number(body.sortOrder ?? 0),
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.PUBLISHED,
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.REVIEWED,
    },
  });

  return ok(data);
}
