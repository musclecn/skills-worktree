import { TranslationStatus, UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { translateToEnglish } from "@/lib/translation";

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const text = body?.text ? String(body.text).trim() : "";
  if (!text) {
    return fail("text is required", 422);
  }

  try {
    const translatedText = await translateToEnglish(text);
    return ok({
      translatedText,
      translationStatus: TranslationStatus.MACHINE_TRANSLATED,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "translation failed", 500);
  }
}
