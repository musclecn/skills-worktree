import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getHomeData,
  getNewsData,
  getNewsDetail,
  getPageData,
  getProductDetail,
  getProductsData,
  getSolutionDetail,
  getSolutionsData,
} from "@/lib/data";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";
import { HeroCarousel } from "@/components/public/HeroCarousel";

function formatDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

const HOME_STATS = [
  { value: "2018", labelZh: "公司成立", labelEn: "Founded" },
  { value: "31+", labelZh: "软件著作权", labelEn: "Software Copyrights" },
  { value: "36", labelZh: "税区申报覆盖", labelEn: "Tax Zones Covered" },
  { value: "18+", labelZh: "税费种支持", labelEn: "Tax Types Supported" },
  { value: "400+", labelZh: "风险模型", labelEn: "Risk Models" },
  { value: "200+", labelZh: "政务城市服务", labelEn: "Government City Cases" },
];

const HOME_PRODUCT_FALLBACKS = [
  "/uploads/ppt2025/image140.png",
  "/uploads/ppt2025/image141.png",
  "/uploads/ppt2025/image142.png",
  "/uploads/ppt2025/image146.png",
];

const HOME_SOLUTION_FALLBACKS = [
  "/uploads/ppt2025/image148.png",
  "/uploads/ppt2025/image569.png",
  "/uploads/ppt2025/image220.png",
];

const HOME_HERO_FALLBACKS = [
  "/uploads/certs/taxs-high-tech-cert-2023-blue.png",
  "/uploads/certs/taxs-software-enterprise-cert-2024-blue.png",
  "/uploads/certs/taxs-high-tech-cert.png",
];

function parseImageList(value: string | null | undefined, fallbacks: string[]) {
  const configured = (value ?? "")
    .split(/[\n,，|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const source = configured.length > 0 ? configured : fallbacks;
  return Array.from(new Set(source));
}

const PRODUCT_SECTION_META: Record<
  string,
  { labelZh: string; labelEn: string; tone: "brand" | "accent" | "neutral" }
> = {
  capability: { labelZh: "核心能力", labelEn: "Capabilities", tone: "brand" },
  architecture: { labelZh: "技术架构", labelEn: "Architecture", tone: "accent" },
  efficiency: { labelZh: "交付效率", labelEn: "Efficiency", tone: "neutral" },
  output: { labelZh: "销项管理", labelEn: "Output Invoices", tone: "brand" },
  input: { labelZh: "进项管理", labelEn: "Input Invoices", tone: "accent" },
  control: { labelZh: "规则管控", labelEn: "Controls", tone: "neutral" },
  risk: { labelZh: "风险识别", labelEn: "Risk Detection", tone: "brand" },
  warning: { labelZh: "预警处置", labelEn: "Alerts", tone: "accent" },
  integration: { labelZh: "接入集成", labelEn: "Integration", tone: "brand" },
  operation: { labelZh: "平台运营", labelEn: "Operations", tone: "neutral" },
  deployment: { labelZh: "部署模式", labelEn: "Deployment", tone: "accent" },
  filing: { labelZh: "申报流程", labelEn: "Filing Flow", tone: "brand" },
  coverage: { labelZh: "覆盖范围", labelEn: "Coverage", tone: "accent" },
  iit: { labelZh: "个税能力", labelEn: "IIT", tone: "brand" },
  compliance: { labelZh: "合规治理", labelEn: "Compliance", tone: "brand" },
  collection: { labelZh: "档案采集", labelEn: "Collection", tone: "accent" },
  governance: { labelZh: "保管利用", labelEn: "Governance", tone: "neutral" },
  process: { labelZh: "端到端流程", labelEn: "Process", tone: "brand" },
  value: { labelZh: "业务价值", labelEn: "Value", tone: "accent" },
  scenario: { labelZh: "应用场景", labelEn: "Scenarios", tone: "neutral" },
  data: { labelZh: "数据目录", labelEn: "Data", tone: "brand" },
  channel: { labelZh: "通道能力", labelEn: "Channels", tone: "accent" },
  api: { labelZh: "接口目录", labelEn: "API Catalog", tone: "brand" },
  "indirect-tax": { labelZh: "间接税", labelEn: "Indirect Tax", tone: "brand" },
  "direct-tax": { labelZh: "直接税", labelEn: "Direct Tax", tone: "accent" },
  "knowledge-base": { labelZh: "知识库", labelEn: "Knowledge Base", tone: "neutral" },
};

type ProductVisualAsset = {
  src: string;
  altZh: string;
  altEn: string;
};

const PRODUCT_GALLERY_ASSETS: Record<string, ProductVisualAsset[]> = {
  "yunpiaotong-foundation": [
    {
      src: "/ppt-slides/ppt2025/slide-018.png",
      altZh: "云票通平台低代码底座能力章节页",
      altEn: "YPT low-code foundation slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-019.png",
      altZh: "云票通平台技术架构与开发模式章节页",
      altEn: "YPT architecture slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-020.png",
      altZh: "云票通平台通用数据连接器章节页",
      altEn: "YPT connector slide",
    },
  ],
  "supply-chain-invoice-collaboration": [
    {
      src: "/ppt-slides/ppt2025/slide-026.png",
      altZh: "供应链票据协同销项发票全流程章节页",
      altEn: "Supply-chain output invoice slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-031.png",
      altZh: "供应链票据协同规则与风控章节页",
      altEn: "Supply-chain control slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-033.png",
      altZh: "供应链票据协同进项发票管理章节页",
      altEn: "Supply-chain input invoice slide",
    },
  ],
  "tax-risk-governance": [
    {
      src: "/ppt-slides/ppt2025/slide-053.png",
      altZh: "税务风险管理功能概览章节页",
      altEn: "Tax risk overview slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-057.png",
      altZh: "税务风险管理应用场景章节页",
      altEn: "Tax risk scenario slide",
    },
  ],
  "leqi-access-platform": [
    {
      src: "/ppt-slides/ppt2025/slide-038.png",
      altZh: "乐企接入七大能力章节页",
      altEn: "Leqi capability slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-039.png",
      altZh: "乐企脚本化可编程能力章节页",
      altEn: "Leqi scriptable slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-040.png",
      altZh: "乐企接入后台管理章节页",
      altEn: "Leqi back-office slide",
    },
  ],
  "smart-tax-filing": [
    {
      src: "/ppt-slides/ppt2025/slide-043.png",
      altZh: "智能纳税申报全流程章节页",
      altEn: "Smart filing flow slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-045.png",
      altZh: "智能纳税申报覆盖能力章节页",
      altEn: "Smart filing coverage slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-046.png",
      altZh: "智能纳税申报凭证下载与留痕章节页",
      altEn: "Smart filing certificate slide",
    },
  ],
  "individual-income-tax-platform": [
    {
      src: "/ppt-slides/ppt2025/slide-048.png",
      altZh: "个税申报模块亮点章节页",
      altEn: "IIT highlight slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-049.png",
      altZh: "个税申报计算与人员报送章节页",
      altEn: "IIT filing calculation slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-050.png",
      altZh: "个税申报全流程应用场景章节页",
      altEn: "IIT scenario slide",
    },
  ],
  "electronic-accounting-archive": [
    {
      src: "/ppt-slides/ppt2025/slide-096.png",
      altZh: "电子会计档案收集整编章节页",
      altEn: "Electronic archive collection slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-103.png",
      altZh: "电子会计档案纸电协同保管章节页",
      altEn: "Electronic archive governance slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-111.png",
      altZh: "电子会计档案权限与安全章节页",
      altEn: "Electronic archive security slide",
    },
  ],
  "export-tax-rebate-platform": [
    {
      src: "/ppt-slides/ppt2025/slide-114.png",
      altZh: "出口退税规则配置与业务总览章节页",
      altEn: "Export rebate overview slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-115.png",
      altZh: "出口退税核销与申报流程章节页",
      altEn: "Export rebate process slide",
    },
  ],
  "global-tax-intelligence-platform": [
    {
      src: "/ppt-slides/ppt-overseas/slide-002.png",
      altZh: "海外全球税务数智化平台间接税章节页",
      altEn: "Global overseas indirect-tax slide",
    },
    {
      src: "/ppt-slides/ppt-overseas/slide-004.png",
      altZh: "海外全球税务数智化平台直接税章节页",
      altEn: "Global overseas direct-tax slide",
    },
    {
      src: "/ppt-slides/ppt-overseas/slide-006.png",
      altZh: "海外全球税务数智化平台知识库章节页",
      altEn: "Global overseas knowledge-base slide",
    },
  ],
  "full-ticket-pass": [
    {
      src: "/ppt-slides/ppt2025/slide-079.png",
      altZh: "全票通平台框架章节页",
      altEn: "FullTicket framework slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-081.png",
      altZh: "全票通电商开票解决方案章节页",
      altEn: "FullTicket scenario slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-082.png",
      altZh: "全票通订单管理与自动开票章节页",
      altEn: "FullTicket operation slide",
    },
  ],
  "tax-data-service-platform": [
    {
      src: "/ppt-slides/ppt2025/slide-118.png",
      altZh: "数据服务平台功能介绍章节页",
      altEn: "Data service overview slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-120.png",
      altZh: "数据服务平台任务与下载章节页",
      altEn: "Data service task slide",
    },
    {
      src: "/ppt-slides/ppt2025/slide-122.png",
      altZh: "数据服务平台数据列表与接口说明章节页",
      altEn: "Data service catalog slide",
    },
  ],
  "open-api-ecosystem": [
    {
      src: "/ppt-slides/ppt2025/slide-084.png",
      altZh: "开放生态接口中心章节页",
      altEn: "Open API ecosystem slide",
    },
  ],
};

function getProductSectionMeta(locale: AppLocale, type: string) {
  const meta = PRODUCT_SECTION_META[type] ?? {
    labelZh: "产品模块",
    labelEn: "Product Module",
    tone: "neutral" as const,
  };

  return {
    label: locale === "zh" ? meta.labelZh : meta.labelEn,
    tone: meta.tone,
  };
}

function getSectionAnchor(index: number) {
  return `section-${index + 1}`;
}

function getConfiguredProductGallery(slug: string, locale: AppLocale) {
  return (PRODUCT_GALLERY_ASSETS[slug] ?? []).map((item) => ({
    ...item,
    alt: locale === "zh" ? item.altZh : item.altEn,
  }));
}

function toVisualAsset(src: string, alt: string) {
  return { src, alt };
}

function getProductGallery(
  product: { slug: string; name: string; bannerUrl?: string | null; galleryImages?: string[] | null },
  locale: AppLocale,
) {
  const galleryImages = Array.isArray(product.galleryImages)
    ? product.galleryImages.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (galleryImages.length > 0) {
    return galleryImages.map((src, index) =>
      toVisualAsset(
        src,
        locale === "zh" ? `${product.name} 产品图片 ${index + 1}` : `${product.name} image ${index + 1}`,
      ),
    );
  }

  const configured = getConfiguredProductGallery(product.slug, locale);
  if (configured.length > 0) {
    return configured;
  }

  if (product.bannerUrl) {
    return [
      toVisualAsset(
        product.bannerUrl,
        locale === "zh" ? `${product.name} 产品主图` : `${product.name} cover image`,
      ),
    ];
  }

  return [];
}

function getPrimaryProductVisual(
  product: { slug: string; name: string; bannerUrl?: string | null; galleryImages?: string[] | null },
  locale: AppLocale,
) {
  return getProductGallery(product, locale)[0] ?? null;
}

function ProductVisual({
  asset,
  className,
  priority = false,
}: {
  asset: { src: string; alt: string };
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={className}>
      <Image src={asset.src} alt={asset.alt} width={1600} height={900} priority={priority} />
    </div>
  );
}

const SOLUTION_ART_META: Record<
  string,
  { labelZh: string; labelEn: string; captionZh: string; captionEn: string; tone: string }
> = {
  "group-tax-digitalization": {
    labelZh: "集团治理",
    labelEn: "Group Governance",
    captionZh: "多组织税务共享与票税财档协同",
    captionEn: "Multi-entity tax and finance orchestration",
    tone: "sapphire",
  },
  "ecommerce-fullticket-solution": {
    labelZh: "电商开票",
    labelEn: "E-commerce Invoicing",
    captionZh: "高频订单、自动开票与链路回传",
    captionEn: "High-volume order and invoicing flow",
    tone: "sky",
  },
  "leqi-access-solution": {
    labelZh: "乐企接入",
    labelEn: "Leqi Access",
    captionZh: "接口编排、通道治理与持续运维",
    captionEn: "Interface orchestration and channel governance",
    tone: "teal",
  },
  "e-archive-compliance": {
    labelZh: "电子档案",
    labelEn: "E-archive",
    captionZh: "归档采集、四性检测与合规保管",
    captionEn: "Archive capture and compliance retention",
    tone: "violet",
  },
  "export-rebate-solution": {
    labelZh: "出口退税",
    labelEn: "Export Rebate",
    captionZh: "关单核销、申报协同与风险留痕",
    captionEn: "Declaration reconciliation and rebate control",
    tone: "amber",
  },
};

type SolutionVisualAsset = {
  src: string;
  altZh: string;
  altEn: string;
};

const SOLUTION_SCREENSHOT_ASSETS: Record<string, SolutionVisualAsset[]> = {
  "group-tax-digitalization": [
    {
      src: "/ppt-slides/ppt2025/slide-018.png",
      altZh: "集团一体化方案对应的云票通低代码底座截图",
      altEn: "Group integration related YPT low-code foundation screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-043.png",
      altZh: "集团一体化方案对应的智能纳税申报截图",
      altEn: "Group integration related tax filing screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-096.png",
      altZh: "集团一体化方案对应的电子会计档案截图",
      altEn: "Group integration related e-archive screenshot",
    },
  ],
  "ecommerce-fullticket-solution": [
    {
      src: "/ppt-slides/ppt2025/slide-079.png",
      altZh: "全票通电商开票平台功能框架截图",
      altEn: "FullTicket framework screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-081.png",
      altZh: "全票通电商开票方案截图",
      altEn: "FullTicket scenario screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-082.png",
      altZh: "全票通订单管理与自动开票截图",
      altEn: "FullTicket order and invoicing screenshot",
    },
  ],
  "leqi-access-solution": [
    {
      src: "/ppt-slides/ppt2025/slide-038.png",
      altZh: "乐企一站式接入逻辑说明截图",
      altEn: "Leqi access logic screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-039.png",
      altZh: "乐企脚本化能力截图",
      altEn: "Leqi scripting screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-040.png",
      altZh: "乐企接入后台管理截图",
      altEn: "Leqi back-office screenshot",
    },
  ],
  "e-archive-compliance": [
    {
      src: "/ppt-slides/ppt2025/slide-096.png",
      altZh: "电子会计档案业务模型截图",
      altEn: "E-archive business model screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-103.png",
      altZh: "电子会计档案保管利用截图",
      altEn: "E-archive governance screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-111.png",
      altZh: "电子会计档案权限与安全截图",
      altEn: "E-archive security screenshot",
    },
  ],
  "export-rebate-solution": [
    {
      src: "/ppt-slides/ppt2025/slide-114.png",
      altZh: "出口退税应用架构概览截图",
      altEn: "Export rebate overview screenshot",
    },
    {
      src: "/ppt-slides/ppt2025/slide-115.png",
      altZh: "出口退税核销与申报流程截图",
      altEn: "Export rebate filing screenshot",
    },
  ],
};

function getSolutionArtMeta(slug: string, locale: AppLocale) {
  const meta = SOLUTION_ART_META[slug] ?? {
    labelZh: "方案设计",
    labelEn: "Solution Design",
    captionZh: "业务链路、实施路径与能力组合",
    captionEn: "Business flow, implementation path, and capability mix",
    tone: "sapphire",
  };

  return {
    label: locale === "zh" ? meta.labelZh : meta.labelEn,
    caption: locale === "zh" ? meta.captionZh : meta.captionEn,
    tone: meta.tone,
  };
}

function getSolutionScreenshot(slug: string, locale: AppLocale, index = 0) {
  const assets = SOLUTION_SCREENSHOT_ASSETS[slug] ?? [];
  if (assets.length === 0) {
    return null;
  }

  const asset = assets[index % assets.length];
  return {
    src: asset.src,
    alt: locale === "zh" ? asset.altZh : asset.altEn,
  };
}

function SolutionGlassArtwork({
  slug,
  locale,
  title,
  className,
  compact = false,
  screenshotIndex = 0,
}: {
  slug: string;
  locale: AppLocale;
  title: string;
  className: string;
  compact?: boolean;
  screenshotIndex?: number;
}) {
  const meta = getSolutionArtMeta(slug, locale);
  const screenshot = getSolutionScreenshot(slug, locale, screenshotIndex);

  return (
    <div
      className={`${className} solution-glass-art tone-${meta.tone}${compact ? " compact" : ""}`}
      aria-label={title}
    >
      {screenshot ? (
        <div className="solution-glass-shot">
          <Image src={screenshot.src} alt={screenshot.alt} fill sizes="(max-width: 980px) 100vw, 50vw" />
          <div className="solution-glass-shot-wash" />
        </div>
      ) : null}
      <div className="solution-glass-blur blur-a" />
      <div className="solution-glass-blur blur-b" />
      <div className="solution-glass-grid" />
      <div className="solution-glass-noise" />
      <div className="solution-glass-panel">
        <span>{meta.label}</span>
        <strong>{title}</strong>
        <small>{meta.caption}</small>
      </div>
    </div>
  );
}

export async function HomeView({ locale }: { locale: AppLocale }) {
  const data = await getHomeData(locale);
  const siteConfig = data.site;

  const heroTitle =
    siteConfig?.homeHeroTitle ||
    (locale === "zh" ? "企业税务数字一体化管理平台" : "Enterprise Tax Digital Integration Platform");
  const heroSubtitle =
    siteConfig?.homeHeroSubtitle ||
    (locale === "zh"
      ? "基于生成式底座与乐企+API双通道能力，帮助企业构建票、税、财、档一体化管理体系。"
      : "Built on a generative low-code foundation and dual-channel Leqi+API capabilities for integrated invoice-tax-finance-archive governance.");
  const heroImageUrls = parseImageList(siteConfig?.homeHeroImageUrl, HOME_HERO_FALLBACKS);
  const productSectionTitle =
    siteConfig?.homeProductSectionTitle || (locale === "zh" ? "财税服务产品与能力全景" : "Main Products");
  const solutionSectionSubtitle =
    siteConfig?.homeSolutionSectionSubtitle ||
    (locale === "zh" ? "聚焦典型行业场景的方案概要" : "Snapshot of industry-focused solution tracks");

  return (
    <>
      <section className="hero-immersive">
        <div className="hero-noise" />
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="container hero-split">
          <div className="hero-copy">
            <p className="hero-kicker motion-reveal">TAXS DIGITAL TAX ENGINE</p>
            <h1 className="hero-title motion-reveal">{heroTitle}</h1>
            <p className="hero-subtitle motion-reveal">{heroSubtitle}</p>
            <div className="hero-actions motion-reveal">
              <Link className="cta-button" href={localizePath(locale, "/products")}>
                {locale === "zh" ? "查看产品体系" : "View Product System"}
              </Link>
              <Link className="ghost-link" href={localizePath(locale, "/solutions")}>
                {locale === "zh" ? "行业解决方案" : "Industry Solutions"}
              </Link>
            </div>
          </div>
          <div className="hero-visual motion-reveal">
            <HeroCarousel
              images={heroImageUrls}
              alt={locale === "zh" ? "泰可思财税平台首页主视觉" : "Taxs platform hero visual"}
            />
          </div>
        </div>
      </section>

      <section className="container metrics-panel motion-reveal">
        {HOME_STATS.map((item) => (
          <article key={item.labelZh}>
            <h3>{item.value}</h3>
            <p>{locale === "zh" ? item.labelZh : item.labelEn}</p>
          </article>
        ))}
      </section>

      <section className="container compact-section motion-reveal">
        <div className="section-head">
          <h2>{productSectionTitle}</h2>
        </div>
        <div className="home-thumb-grid">
          {data.categories.map((item, index) => (
            <Link className="home-thumb-card" href={localizePath(locale, "/products")} key={item.id}>
              <div className="home-thumb-media">
                <Image
                  src={
                    item.iconUrl ||
                    siteConfig?.homeProductImages?.[index] ||
                    HOME_PRODUCT_FALLBACKS[index % HOME_PRODUCT_FALLBACKS.length]
                  }
                  alt={item.name}
                  width={1032}
                  height={640}
                />
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container compact-section motion-reveal">
        <div className="section-head">
          <h2 className="home-solution-title">{solutionSectionSubtitle}</h2>
        </div>
        <div className="home-thumb-grid solution">
          {data.solutions.map((item, index) => (
            <Link className="home-thumb-card" href={localizePath(locale, "/solutions")} key={item.id}>
              <div className="home-thumb-media">
                <Image
                  src={
                    item.coverUrl ||
                    siteConfig?.homeSolutionImages?.[index] ||
                    HOME_SOLUTION_FALLBACKS[index % HOME_SOLUTION_FALLBACKS.length]
                  }
                  alt={item.title}
                  width={1032}
                  height={640}
                />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container final-cta motion-reveal">
        <p className="eyebrow">{data.site?.homeAboutTitle || (locale === "zh" ? "关于我们" : "About")}</p>
        <p>
          {data.site?.homeAboutContent ||
            (locale === "zh"
              ? "泰可思成立于2018年，核心团队深耕财税行业二十余年，持续推进企业税务数字化与合规治理能力建设。"
              : "Founded in 2018, Taxs is backed by a senior team with over two decades in tax technology, delivering digital tax and compliance transformation." )}
        </p>
        <Link className="cta-button" href={localizePath(locale, "/contact")}>
          {locale === "zh" ? "咨询与方案交流" : "Contact for Consultation"}
        </Link>
      </section>
    </>
  );
}

export async function ProductsView({ locale }: { locale: AppLocale }) {
  const categories = await getProductsData(locale);

  return (
    <div className="container page-frame">
      <section className="page-lead product-page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "产品中心" : "Products"}</p>
        <h1>{locale === "zh" ? "财税服务产品与能力全景" : "Full landscape of Taxs product capabilities"}</h1>
      </section>

      <section className="product-hub motion-reveal">
        <aside className="product-tree">
          <div className="product-tree-card">
            <p className="eyebrow">{locale === "zh" ? "产品栏位" : "Product Menu"}</p>
            <div className="product-tree-list">
              {categories.map((category) => (
                <div key={category.id} className="product-tree-group">
                  <a className="product-tree-parent" href={`#${category.slug}`}>
                    {category.name}
                  </a>
                  <div className="product-tree-children">
                    {category.products.map((product) => (
                      <Link key={product.id} href={localizePath(locale, `/products/${product.slug}`)}>
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="product-hub-main">
          {categories.map((category) => (
            <section key={category.id} id={category.slug} className="product-cluster">
              <header className="product-cluster-head">
                <div>
                  <h2>{category.name}</h2>
                </div>
                <p>{category.description}</p>
              </header>

              <div className="product-submenu">
                {category.products.map((product, index) => {
                  const visual = getPrimaryProductVisual(product, locale);

                  return (
                  <Link
                    className="product-submenu-card"
                    key={product.id}
                    href={localizePath(locale, `/products/${product.slug}`)}
                  >
                    {visual ? <ProductVisual asset={visual} className="product-submenu-media" /> : null}
                    <span className="product-submenu-index">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.summary}</p>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export async function ProductDetailView({ locale, slug }: { locale: AppLocale; slug: string }) {
  const [product, categories] = await Promise.all([getProductDetail(slug, locale), getProductsData(locale)]);
  if (!product) {
    notFound();
  }

  const heroVisual = getPrimaryProductVisual(product, locale);

  return (
    <div className="container product-detail-layout">
      <aside className="product-tree motion-reveal">
        <div className="product-tree-card sticky">
          <p className="eyebrow">{locale === "zh" ? "产品栏目" : "Product Menu"}</p>
          <h2>{locale === "zh" ? "分类 / 产品" : "Category / Product"}</h2>
          <div className="product-tree-list">
            {categories.map((category) => (
              <div key={category.id} className="product-tree-group">
                <div
                  className={`product-tree-parent ${category.slug === product.categorySlug ? "active" : ""}`}
                >
                  {category.name}
                </div>
                <div className="product-tree-children">
                  {category.products.map((item) => (
                    <Link
                      key={item.id}
                      className={item.slug === product.slug ? "active" : ""}
                      href={localizePath(locale, `/products/${item.slug}`)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="product-detail-main">
        <section className="product-hero-detail motion-reveal">
          <div className="product-hero-copy">
            <p className="eyebrow">{product.categoryName}</p>
            <h1>{product.name}</h1>
            <p>{product.summary}</p>
            <div className="product-anchor-strip">
              {product.sections.map((section, index) => (
                <a key={section.id} href={`#${getSectionAnchor(index)}`}>
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {heroVisual ? <ProductVisual asset={heroVisual} className="product-hero-visual" priority /> : null}
        </section>

        {product.sections.map((section, index) => {
          const meta = getProductSectionMeta(locale, section.type);

          return (
            <section
              className="product-detail-section motion-reveal"
              id={getSectionAnchor(index)}
              key={section.id}
            >
              <div className="product-section-head">
                <span className={`product-section-badge tone-${meta.tone}`}>{meta.label}</span>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>

              <div className="product-point-grid">
                {section.items.map((item, itemIndex) => (
                  <article className="product-point-card" key={item.id}>
                    <span className="product-point-index">{String(itemIndex + 1).padStart(2, "0")}</span>
                    {item.title ? <h3>{item.title}</h3> : null}
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <section className="product-bottom-cta motion-reveal">
          <p className="eyebrow">{locale === "zh" ? "继续了解" : "Next Step"}</p>
          <h2>{locale === "zh" ? "需要结合业务场景看完整方案？" : "Need the full solution view?"}</h2>
          <p>
            {locale === "zh"
              ? "可以继续查看同栏位其他产品，或联系泰可思获取按行业、税种和组织模式梳理后的实施方案。"
              : "Continue with adjacent products in the same category, or contact Taxs for an implementation plan by industry, tax type, and operating model."}
          </p>
          <div className="hero-actions">
            <Link className="cta-button" href={localizePath(locale, "/contact")}>
              {locale === "zh" ? "联系咨询" : "Contact Us"}
            </Link>
            <Link className="ghost-link product-dark-link" href={localizePath(locale, "/products")}>
              {locale === "zh" ? "返回产品中心" : "Back to Products"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export async function SolutionsView({ locale }: { locale: AppLocale }) {
  const data = await getSolutionsData(locale);

  return (
    <div className="container page-frame">
      <section className="page-lead solution-page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "解决方案" : "Solutions"}</p>
        <h1>{locale === "zh" ? "聚焦高频行业与复杂场景" : "Focused on high-frequency and complex tax scenarios"}</h1>
        <p>
          {locale === "zh"
            ? "解决方案页面沿用产品中心的浏览结构，按方案条线集中展示典型场景、实施重点与落地入口，方便从业务问题快速进入对应方案。"
            : "The solutions page follows the same browsing rhythm as the product center, organizing each track around scenarios, implementation focus, and direct entry points."}
        </p>
        <div className="product-page-stats">
          <span>{locale === "zh" ? `${data.length} 条方案主线` : `${data.length} solution tracks`}</span>
          <span>
            {locale === "zh" ? "按业务场景集中浏览" : "Browse by business scenario"}
          </span>
        </div>
      </section>

      <section className="solution-hub motion-reveal">
        <aside className="solution-tree">
          <div className="solution-tree-card">
            <p className="eyebrow">{locale === "zh" ? "方案导航" : "Solution Menu"}</p>
            <h2>{locale === "zh" ? "方案总览" : "Solution Overview"}</h2>
            <div className="solution-tree-list">
              {data.map((item) => (
                <a key={item.id} className="solution-tree-link" href={`#${item.slug}`}>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="solution-hub-main">
          {data.map((item, index) => (
            <section key={item.id} id={item.slug} className="solution-cluster">
              <header className="solution-cluster-head">
                <span className="solution-cluster-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="solution-cluster-copy">
                  <p className="eyebrow">{locale === "zh" ? "方案条线" : "Solution Track"}</p>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </div>
              </header>

              <Link className="solution-spotlight-card" href={localizePath(locale, `/solutions/${item.slug}`)}>
                <SolutionGlassArtwork
                  slug={item.slug}
                  locale={locale}
                  title={item.title}
                  className="solution-spotlight-media"
                  screenshotIndex={0}
                />
                <div className="solution-spotlight-body">
                  <div className="solution-spotlight-tags">
                    <span>{locale === "zh" ? "痛点梳理" : "Pain Points"}</span>
                    <span>{locale === "zh" ? "方案优势" : "Advantages"}</span>
                    <span>{locale === "zh" ? "架构扩展" : "Architecture"}</span>
                  </div>
                  <h3>
                    {locale === "zh" ? "查看方案详情与实施重点" : "View the full solution and implementation focus"}
                  </h3>
                  <p>
                    {locale === "zh"
                      ? "进入详情页后可继续查看该方案的业务痛点、能力优势与架构说明。"
                      : "Open the detail page to review pain points, capability advantages, and architecture notes."}
                  </p>
                  <span className="solution-spotlight-cta">
                    {locale === "zh" ? "进入方案详情" : "Open Solution"}
                  </span>
                </div>
              </Link>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export async function SolutionDetailView({ locale, slug }: { locale: AppLocale; slug: string }) {
  const data = await getSolutionDetail(slug, locale);
  if (!data) {
    notFound();
  }

  return (
    <div className="container page-frame solution-detail-layout">
      <section className="solution-hero-detail motion-reveal">
        <div className="solution-hero-copy">
          <p className="eyebrow">{locale === "zh" ? "方案详情" : "Solution Detail"}</p>
          <h1>{data.title}</h1>
          <p>{data.summary}</p>
          <div className="product-anchor-strip">
            <a href="#pain-points">{locale === "zh" ? "业务痛点" : "Pain Points"}</a>
            <a href="#advantages">{locale === "zh" ? "方案优势" : "Advantages"}</a>
            {data.architectures.length > 0 ? (
              <a href="#architecture">{locale === "zh" ? "架构扩展" : "Architecture"}</a>
            ) : null}
          </div>
        </div>

        <SolutionGlassArtwork
          slug={data.slug}
          locale={locale}
          title={data.title}
          className="solution-hero-visual"
          screenshotIndex={0}
        />
      </section>

      <section className="detail-grid motion-reveal">
        <article id="pain-points" className="detail-block">
          <h2>{locale === "zh" ? "业务痛点" : "Pain Points"}</h2>
          <ul className="detail-points compact">
            {data.painPoints.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
          </ul>
        </article>

        <article id="advantages" className="detail-block">
          <h2>{locale === "zh" ? "方案优势" : "Advantages"}</h2>
          <ul className="detail-points compact">
            {data.advantages.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {data.architectures.length > 0 ? (
        <section id="architecture" className="detail-block motion-reveal solution-architecture-block">
          <h2>{locale === "zh" ? "架构与扩展" : "Architecture"}</h2>
          <div className="solution-architecture-grid">
            {data.architectures.map((item, index) => (
              <article key={item.id} className="solution-architecture-card">
                <SolutionGlassArtwork
                  slug={data.slug}
                  locale={locale}
                  title={item.title}
                  className="solution-architecture-visual"
                  compact
                  screenshotIndex={index + 1}
                />
                <div className="solution-architecture-copy">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export async function NewsView({ locale }: { locale: AppLocale }) {
  const data = await getNewsData(locale);

  return (
    <div className="container page-frame">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "新闻动态" : "News"}</p>
        <h1>{locale === "zh" ? "产品升级与行业实践" : "Product releases and field practices"}</h1>
      </section>

      <section className="news-list motion-reveal">
        {data.map((item) => (
          <Link key={item.id} href={localizePath(locale, `/news/${item.slug}`)}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
            <small>{formatDate(item.publishedAt)}</small>
          </Link>
        ))}
      </section>
    </div>
  );
}

export async function NewsDetailView({ locale, slug }: { locale: AppLocale; slug: string }) {
  const item = await getNewsDetail(slug, locale);
  if (!item) {
    notFound();
  }

  return (
    <div className="container page-frame">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "新闻详情" : "News Detail"}</p>
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        {item.publishedAt ? <small>{formatDate(item.publishedAt)}</small> : null}
      </section>

      <section className="detail-block rich-content motion-reveal">
        <div>{item.content}</div>
      </section>
    </div>
  );
}

export async function StaticPageView({ locale, slug }: { locale: AppLocale; slug: string }) {
  const page = await getPageData(slug, locale);
  if (!page) {
    notFound();
  }

  return (
    <div className="container page-frame">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "页面内容" : "Page"}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </section>

      <section className="detail-block rich-content motion-reveal">
        <div>{page.content}</div>
      </section>
    </div>
  );
}
