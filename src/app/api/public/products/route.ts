import { fail, ok } from "@/lib/api";
import { getProductDetail, getProductsData } from "@/lib/data";
import { normalizeLocale } from "@/lib/i18n";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = normalizeLocale(searchParams.get("lang"));
  const slug = searchParams.get("slug");

  if (slug) {
    const detail = await getProductDetail(slug, lang);
    if (!detail) {
      return fail("Not found", 404);
    }
    return ok(detail);
  }

  const data = await getProductsData(lang);
  return ok(data);
}
