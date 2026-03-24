import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const data = await prisma.solution.findMany({
    include: {
      painPoints: true,
      advantages: true,
      architectures: true,
    },
    orderBy: { sortOrder: "asc" },
  });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.titleZh || !body?.titleEn) {
    return fail("Missing fields", 422);
  }

  const data = await prisma.solution.create({
    data: {
      slug: String(body.slug),
      titleZh: String(body.titleZh),
      titleEn: String(body.titleEn),
      summaryZh: body.summaryZh ? String(body.summaryZh) : null,
      summaryEn: body.summaryEn ? String(body.summaryEn) : null,
      coverUrl: body.coverUrl ? String(body.coverUrl) : null,
      sortOrder: Number(body.sortOrder ?? 0),
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.PUBLISHED,
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.REVIEWED,
    },
  });

  return ok(data);
}
