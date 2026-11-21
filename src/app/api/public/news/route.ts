import { fail, ok } from "@/lib/api";
import { getNewsData, getNewsDetail, parseNewsCategory } from "@/lib/data";
import { normalizeLocale } from "@/lib/i18n";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = normalizeLocale(searchParams.get("lang"));
  const slug = searchParams.get("slug");
  const category = parseNewsCategory(searchParams.get("category"));

  if (slug) {
    const detail = await getNewsDetail(slug, lang);
    if (!detail) {
      return fail("Not found", 404);
    }
    return ok(detail);
  }

  const data = await getNewsData(lang, category);
  return ok(data);
}
