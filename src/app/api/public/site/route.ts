import { ok } from "@/lib/api";
import { getSiteData } from "@/lib/data";
import { normalizeLocale } from "@/lib/i18n";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = normalizeLocale(searchParams.get("lang"));
  const data = await getSiteData(lang);
  return ok(data);
}
