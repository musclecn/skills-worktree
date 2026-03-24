import { PublishStatus, TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const data = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.pageKey || !body?.slug || !body?.titleZh || !body?.titleEn) {
    return fail("Missing fields", 422);
  }

  const data = await prisma.page.create({
    data: {
      pageKey: String(body.pageKey),
      slug: String(body.slug),
      titleZh: String(body.titleZh),
      titleEn: String(body.titleEn),
      summaryZh: body.summaryZh ? String(body.summaryZh) : null,
      summaryEn: body.summaryEn ? String(body.summaryEn) : null,
      contentZh: body.contentZh ? String(body.contentZh) : null,
      contentEn: body.contentEn ? String(body.contentEn) : null,
      blocks: body.blocks ?? null,
      publishStatus: (body.publishStatus as PublishStatus) || PublishStatus.DRAFT,
      translationStatus:
        (body.translationStatus as TranslationStatus) || TranslationStatus.DRAFT,
    },
  });
  return ok(data);
}
