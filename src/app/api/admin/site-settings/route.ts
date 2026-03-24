import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  return ok(setting);
}

export async function PUT(req: Request) {
  const auth = await requireRole([UserRole.ADMIN]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return fail("Invalid payload", 422);
  }

  const data = await prisma.siteSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyNameZh: String(body.companyNameZh ?? "苏州泰可思数据科技有限公司"),
      companyNameEn: String(body.companyNameEn ?? "Suzhou Taxs Data Technology Co., Ltd."),
      phone: String(body.phone ?? ""),
      fax: body.fax ? String(body.fax) : null,
      email: String(body.email ?? ""),
      addressZh: String(body.addressZh ?? ""),
      addressEn: String(body.addressEn ?? ""),
      icpRecord: String(body.icpRecord ?? ""),
      copyrightZh: String(body.copyrightZh ?? ""),
      copyrightEn: String(body.copyrightEn ?? ""),
      logoUrl: body.logoUrl ? String(body.logoUrl) : null,
      footerBuilderZh: body.footerBuilderZh ? String(body.footerBuilderZh) : null,
      footerBuilderEn: body.footerBuilderEn ? String(body.footerBuilderEn) : null,
      homeHeroTitleZh: body.homeHeroTitleZh ? String(body.homeHeroTitleZh) : null,
      homeHeroTitleEn: body.homeHeroTitleEn ? String(body.homeHeroTitleEn) : null,
      homeHeroSubtitleZh: body.homeHeroSubtitleZh ? String(body.homeHeroSubtitleZh) : null,
      homeHeroSubtitleEn: body.homeHeroSubtitleEn ? String(body.homeHeroSubtitleEn) : null,
      homeHeroImageUrl: body.homeHeroImageUrl ? String(body.homeHeroImageUrl) : null,
      homeProductSectionTitleZh: body.homeProductSectionTitleZh ? String(body.homeProductSectionTitleZh) : null,
      homeProductSectionTitleEn: body.homeProductSectionTitleEn ? String(body.homeProductSectionTitleEn) : null,
      homeProductSectionSubtitleZh: body.homeProductSectionSubtitleZh ? String(body.homeProductSectionSubtitleZh) : null,
      homeProductSectionSubtitleEn: body.homeProductSectionSubtitleEn ? String(body.homeProductSectionSubtitleEn) : null,
      homeSolutionSectionTitleZh: body.homeSolutionSectionTitleZh ? String(body.homeSolutionSectionTitleZh) : null,
      homeSolutionSectionTitleEn: body.homeSolutionSectionTitleEn ? String(body.homeSolutionSectionTitleEn) : null,
      homeSolutionSectionSubtitleZh: body.homeSolutionSectionSubtitleZh ? String(body.homeSolutionSectionSubtitleZh) : null,
      homeSolutionSectionSubtitleEn: body.homeSolutionSectionSubtitleEn ? String(body.homeSolutionSectionSubtitleEn) : null,
      homeProductImage1: body.homeProductImage1 ? String(body.homeProductImage1) : null,
      homeProductImage2: body.homeProductImage2 ? String(body.homeProductImage2) : null,
      homeProductImage3: body.homeProductImage3 ? String(body.homeProductImage3) : null,
      homeProductImage4: body.homeProductImage4 ? String(body.homeProductImage4) : null,
      homeSolutionImage1: body.homeSolutionImage1 ? String(body.homeSolutionImage1) : null,
      homeSolutionImage2: body.homeSolutionImage2 ? String(body.homeSolutionImage2) : null,
      homeSolutionImage3: body.homeSolutionImage3 ? String(body.homeSolutionImage3) : null,
      homeAboutTitleZh: body.homeAboutTitleZh ? String(body.homeAboutTitleZh) : null,
      homeAboutTitleEn: body.homeAboutTitleEn ? String(body.homeAboutTitleEn) : null,
      homeAboutContentZh: body.homeAboutContentZh ? String(body.homeAboutContentZh) : null,
      homeAboutContentEn: body.homeAboutContentEn ? String(body.homeAboutContentEn) : null,
      homeContactTitleZh: body.homeContactTitleZh ? String(body.homeContactTitleZh) : null,
      homeContactTitleEn: body.homeContactTitleEn ? String(body.homeContactTitleEn) : null,
    },
    update: {
      companyNameZh: String(body.companyNameZh ?? ""),
      companyNameEn: String(body.companyNameEn ?? ""),
      phone: String(body.phone ?? ""),
      fax: body.fax ? String(body.fax) : null,
      email: String(body.email ?? ""),
      addressZh: String(body.addressZh ?? ""),
      addressEn: String(body.addressEn ?? ""),
      icpRecord: String(body.icpRecord ?? ""),
      copyrightZh: String(body.copyrightZh ?? ""),
      copyrightEn: String(body.copyrightEn ?? ""),
      logoUrl: body.logoUrl ? String(body.logoUrl) : null,
      footerBuilderZh: body.footerBuilderZh ? String(body.footerBuilderZh) : null,
      footerBuilderEn: body.footerBuilderEn ? String(body.footerBuilderEn) : null,
      homeHeroTitleZh: body.homeHeroTitleZh ? String(body.homeHeroTitleZh) : null,
      homeHeroTitleEn: body.homeHeroTitleEn ? String(body.homeHeroTitleEn) : null,
      homeHeroSubtitleZh: body.homeHeroSubtitleZh ? String(body.homeHeroSubtitleZh) : null,
      homeHeroSubtitleEn: body.homeHeroSubtitleEn ? String(body.homeHeroSubtitleEn) : null,
      homeHeroImageUrl: body.homeHeroImageUrl ? String(body.homeHeroImageUrl) : null,
      homeProductSectionTitleZh: body.homeProductSectionTitleZh ? String(body.homeProductSectionTitleZh) : null,
      homeProductSectionTitleEn: body.homeProductSectionTitleEn ? String(body.homeProductSectionTitleEn) : null,
      homeProductSectionSubtitleZh: body.homeProductSectionSubtitleZh ? String(body.homeProductSectionSubtitleZh) : null,
      homeProductSectionSubtitleEn: body.homeProductSectionSubtitleEn ? String(body.homeProductSectionSubtitleEn) : null,
      homeSolutionSectionTitleZh: body.homeSolutionSectionTitleZh ? String(body.homeSolutionSectionTitleZh) : null,
      homeSolutionSectionTitleEn: body.homeSolutionSectionTitleEn ? String(body.homeSolutionSectionTitleEn) : null,
      homeSolutionSectionSubtitleZh: body.homeSolutionSectionSubtitleZh ? String(body.homeSolutionSectionSubtitleZh) : null,
      homeSolutionSectionSubtitleEn: body.homeSolutionSectionSubtitleEn ? String(body.homeSolutionSectionSubtitleEn) : null,
      homeProductImage1: body.homeProductImage1 ? String(body.homeProductImage1) : null,
      homeProductImage2: body.homeProductImage2 ? String(body.homeProductImage2) : null,
      homeProductImage3: body.homeProductImage3 ? String(body.homeProductImage3) : null,
      homeProductImage4: body.homeProductImage4 ? String(body.homeProductImage4) : null,
      homeSolutionImage1: body.homeSolutionImage1 ? String(body.homeSolutionImage1) : null,
      homeSolutionImage2: body.homeSolutionImage2 ? String(body.homeSolutionImage2) : null,
      homeSolutionImage3: body.homeSolutionImage3 ? String(body.homeSolutionImage3) : null,
      homeAboutTitleZh: body.homeAboutTitleZh ? String(body.homeAboutTitleZh) : null,
      homeAboutTitleEn: body.homeAboutTitleEn ? String(body.homeAboutTitleEn) : null,
      homeAboutContentZh: body.homeAboutContentZh ? String(body.homeAboutContentZh) : null,
      homeAboutContentEn: body.homeAboutContentEn ? String(body.homeAboutContentEn) : null,
      homeContactTitleZh: body.homeContactTitleZh ? String(body.homeContactTitleZh) : null,
      homeContactTitleEn: body.homeContactTitleEn ? String(body.homeContactTitleEn) : null,
    },
  });

  return ok(data);
}
