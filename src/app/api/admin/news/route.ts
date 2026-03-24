import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

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
      coverUrl: body.coverUrl ? String(body.coverUrl) : null,
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.PUBLISHED,
      publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : new Date(),
      sortOrder: Number(body.sortOrder ?? 0),
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.REVIEWED,
    },
  });

  return ok(data);
}
