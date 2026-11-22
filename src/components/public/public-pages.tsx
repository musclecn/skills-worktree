import Link from "next/link";
import { ESR_APP_NAME, ESR_PRODUCT_PATH, ESR_PRODUCT_SUMMARY } from "@/components/public/legal-pages";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getHomeData,
  getNewsDetail,
  getNewsPage,
  getPageData,
  getProductDetail,
  getProductsData,
  getSolutionDetail,
  getSolutionsData,
} from "@/lib/data";
import { localizePath } from "@/lib/i18n";
import { getShortVideos } from "@/lib/short-videos";
import type { AppLocale } from "@/lib/types";
import { HeroCarousel } from "@/components/public/HeroCarousel";
import { AppointmentForm, type NativeSubmitStatus } from "@/components/public/AppointmentForm";
import { LazyAutoplayVideo } from "@/components/public/LazyAutoplayVideo";
import { HomeAIAssistantDock } from "@/components/public/HomeAIAssistantDock";
import { FuelInvoiceDemoCard } from "@/components/public/FuelInvoiceDemoCard";

function formatDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))}KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
}

const IMAGE_LINE_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i;

function normalizeNewsMediaUrl(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/[),.;，。]+$/g, "");

  const absoluteUploadsMatch = trimmed.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i);
  const normalized = absoluteUploadsMatch ? absoluteUploadsMatch[1] : trimmed;

  if (normalized.startsWith("/uploads/")) {
    return `/api/public/media/${normalized.slice("/uploads/".length)}`;
  }

  return normalized;
}

function extractImageUrlFromLine(line: string) {
  const match = line.match(/(https?:\/\/[^\s]+|\/uploads\/[^\s]+|\/api\/public\/media\/[^\s]+)/i);
  if (!match) return null;

  const normalized = normalizeNewsMediaUrl(match[1]);
  if (!IMAGE_LINE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function renderNewsContent(content: string, locale: AppLocale) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    const imageUrl = extractImageUrlFromLine(line);
    if (imageUrl) {
      return (
        <figure key={`image-${index}`} className="news-content-figure">
          {/* 配图来自第三方新闻源，域名不固定，无法列入 next/image 的白名单 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={locale === "zh" ? `新闻配图 ${index + 1}` : `News image ${index + 1}`}
            loading="lazy"
          />
        </figure>
      );
    }

    return <p key={`line-${index}`}>{line}</p>;
  });
}

type NewsCategoryParam = "ALL" | "COMPANY" | "INDUSTRY";

function getNewsCategoryLabel(locale: AppLocale, category: Exclude<NewsCategoryParam, "ALL">) {
  if (category === "INDUSTRY") {
    return locale === "zh" ? "行业新闻" : "Industry News";
  }
  return locale === "zh" ? "公司新闻" : "Company News";
}

function parseNativeSubmitStatus(value: string | undefined): NativeSubmitStatus | undefined {
  return value === "submitted" || value === "invalid" || value === "rate-limited" ? value : undefined;
}

function toNewsCategoryHref(locale: AppLocale, category: NewsCategoryParam, page = 1) {
  const params = new URLSearchParams();
  if (category !== "ALL") params.set("category", category.toLowerCase());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${localizePath(locale, "/news")}?${query}` : localizePath(locale, "/news");
}

/** 分页页码：首页、末页、当前页前后各两页，其余用省略号。 */
function paginationItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set<number>([1, pageCount]);
  for (let index = page - 2; index <= page + 2; index += 1) {
    if (index >= 1 && index <= pageCount) pages.add(index);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) items.push("gap");
    items.push(value);
  });
  return items;
}

function NewsPagination({
  locale,
  category,
  page,
  pageCount,
  total,
}: {
  locale: AppLocale;
  category: NewsCategoryParam;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (pageCount <= 1) return null;
  const zh = locale === "zh";
  return (
    <nav className="news-pagination motion-reveal" aria-label={zh ? "新闻列表分页" : "News pagination"}>
      <p className="news-pagination-summary">
        {zh ? `第 ${page} / ${pageCount} 页 · 共 ${total} 条` : `Page ${page} of ${pageCount} · ${total} articles`}
      </p>
      <div className="news-pagination-links">
        {page > 1 ? (
          <Link href={toNewsCategoryHref(locale, category, page - 1)} rel="prev">
            {zh ? "上一页" : "Previous"}
          </Link>
        ) : (
          <span className="is-disabled" aria-hidden="true">
            {zh ? "上一页" : "Previous"}
          </span>
        )}
        {paginationItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="news-pagination-gap" aria-hidden="true">
              …
            </span>
          ) : item === page ? (
            <span key={item} className="is-current" aria-current="page">
              {item}
            </span>
          ) : (
            <Link key={item} href={toNewsCategoryHref(locale, category, item)} aria-label={zh ? `第 ${item} 页` : `Page ${item}`}>
              {item}
            </Link>
          ),
        )}
        {page < pageCount ? (
          <Link href={toNewsCategoryHref(locale, category, page + 1)} rel="next">
            {zh ? "下一页" : "Next"}
          </Link>
        ) : (
          <span className="is-disabled" aria-hidden="true">
            {zh ? "下一页" : "Next"}
          </span>
        )}
      </div>
    </nav>
  );
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

const HOME_BOTTOM_AD_IMAGE = "/uploads/taxs-tax-service-ai-agent-banner.gif";
const COMPANY_INTRO_VIDEO_URL = "/company/taxs-company-intro.mp4";
const COMPANY_INTRO_POSTER_URL = "/company/taxs-company-intro-poster.jpg";

const AI_AGENT_VISUALS = [
  "/ai-agent/ai-agent-overview.svg",
  "/ai-agent/ai-agent-invoice.svg",
  "/ai-agent/ai-agent-filing.svg",
  "/ai-agent/ai-agent-advisor.svg",
];

const DATA_ANALYSIS_AGENT_VIDEO_FILE = "泰可思-AI财税分析智能体产品介绍.mp4";
const DATA_ANALYSIS_AGENT_VIDEO_URL = `/short-videos/${encodeURIComponent(DATA_ANALYSIS_AGENT_VIDEO_FILE)}`;
const DATA_ANALYSIS_AGENT_VIDEO_POSTER_URL = `/short-videos/${encodeURIComponent(
  "泰可思-AI财税分析智能体产品介绍.jpg",
)}`;

function HomeMarqueeAd({ locale }: { locale: AppLocale }) {
  return (
    <section
      className="bottom-floating-ad motion-reveal"
      aria-label={locale === "zh" ? "泰可思财税服务与 AI 智能体广告" : "Taxs tax services and AI agents advertisement"}
    >
      <div className="bottom-floating-ad-track">
        {[0, 1].map((item) => (
          <div className="bottom-floating-ad-frame" key={item}>
            <Image
              src={HOME_BOTTOM_AD_IMAGE}
              alt={
                locale === "zh"
                  ? "泰可思个体户与企业财税服务及 AI 智能体"
                  : "Taxs tax services and AI agents for businesses"
              }
              width={1884}
              height={290}
              priority={false}
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function CompanyIntroCopy({ locale, tone = "default" }: { locale: AppLocale; tone?: "default" | "hero" }) {
  const title = locale === "zh" ? "泰可思公司简介视频" : "Taxs Company Introduction";
  const summary =
    locale === "zh"
      ? "通过视频快速了解泰可思的数据科技能力、财税数字化产品体系与企业服务实践。"
      : "A concise video introduction to Taxs, its data technology capabilities, digital tax product system, and enterprise service practice.";
  const tags =
    locale === "zh"
      ? ["财税数字化", "AI 智能体", "企业服务"]
      : ["Digital Tax", "AI Agents", "Enterprise Services"];

  return (
    <div className={`company-intro-copy company-intro-copy-${tone}`}>
      <p className="eyebrow">{locale === "zh" ? "公司简介" : "Company Video"}</p>
      <h2>{title}</h2>
      <p>{summary}</p>
      <div className="company-intro-tags">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function CompanyIntroVideo({ locale, variant }: { locale: AppLocale; variant: "hero" | "about" }) {
  const title = locale === "zh" ? "泰可思公司简介视频" : "Taxs Company Introduction";

  return (
    <section className={`company-intro-video company-intro-video-${variant} motion-reveal`}>
      <div className="company-intro-player">
        {/* 静音自动播放：进入屏幕才加载播放（视频约 62MB，手机上不在首屏时不白白下载） */}
        <LazyAutoplayVideo controls poster={COMPANY_INTRO_POSTER_URL} src={COMPANY_INTRO_VIDEO_URL} ariaLabel={title} />
      </div>
      {variant === "about" ? <CompanyIntroCopy locale={locale} /> : null}
    </section>
  );
}

const AI_AGENT_MODULES = [
  {
    anchor: "ai-agent-overview",
    titleZh: "AI财税智能体产品概述",
    titleEn: "AI Tax Agent Overview",
    summaryZh:
      "以技术中台、数据中台和 AI 中台为底座，面向跨境企业提供从票据处理到申报与顾问服务的一体化能力。",
    summaryEn:
      "Built on technology, data, and AI middle platforms to deliver integrated capabilities from document processing to filing and advisory.",
    highlightsZh: ["多语言识别", "规则自动匹配", "全周期风险管控"],
    highlightsEn: ["Multilingual recognition", "Automated rule matching", "Full-cycle risk control"],
    image: "/ai-agent/ai-agent-overview.svg",
  },
  {
    anchor: "ai-agent-invoice",
    titleZh: "全球AI全链路票据处理",
    titleEn: "Global AI Invoice Processing",
    summaryZh:
      "连接主流业务系统并自动执行票据识别、数据拆分、税率匹配与开票规则计算，支持高并发跨时区处理。",
    summaryEn:
      "Connects mainstream business systems and automates document recognition, data split, tax-rate matching, and invoicing rule calculations.",
    highlightsZh: ["对接 SAP/Oracle", "自动规则编排", "24小时服务能力"],
    highlightsEn: ["SAP/Oracle integration", "Automated rule orchestration", "24/7 service coverage"],
    image: "/ai-agent/ai-agent-invoice.svg",
  },
  {
    anchor: "ai-agent-filing",
    titleZh: "全球AI一键申报",
    titleEn: "Global One-click AI Filing",
    summaryZh:
      "依托全球计税规则引擎与发票识别引擎，支持多主体、多税种、多语言环境下的自动填报与状态回传。",
    summaryEn:
      "Powered by global tax-rule and invoice-recognition engines to enable automated filing and status sync across entities, tax types, and languages.",
    highlightsZh: ["多国税局连接", "复杂税表自动填报", "申报状态实时同步"],
    highlightsEn: ["Multi-country tax authority links", "Auto-filled complex tax forms", "Real-time filing status sync"],
    image: "/ai-agent/ai-agent-filing.svg",
  },
  {
    anchor: "ai-agent-advisor",
    titleZh: "全球AI税务顾问",
    titleEn: "Global AI Tax Advisor",
    summaryZh:
      "内置全球税务法规库与案例库，提供实时政策更新、智能解读、办税日历与场景化问答支持。",
    summaryEn:
      "Provides real-time policy updates, intelligent interpretation, filing calendars, and scenario-based Q&A backed by global tax regulations and case libraries.",
    highlightsZh: ["政策动态更新", "多语言智能解读", "场景化顾问问答"],
    highlightsEn: ["Live policy updates", "Multilingual interpretation", "Scenario-driven advisor Q&A"],
    image: "/ai-agent/ai-agent-advisor.svg",
  },
];

type OpenPlatformCapability = {
  anchor: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  tagsZh: string[];
  tagsEn: string[];
};

const OPEN_PLATFORM_CAPABILITIES: OpenPlatformCapability[] = [
  {
    anchor: "output-invoicing",
    titleZh: "销项开票",
    titleEn: "Output Invoicing",
    summaryZh: "支持蓝票开具、红票处理、开票结果回传与业务单据状态同步。",
    summaryEn: "Supports blue invoice issuance, red invoice handling, result callbacks, and document status sync.",
    tagsZh: ["开票", "红蓝票", "回传"],
    tagsEn: ["Issue", "Red/Blue", "Callback"],
  },
  {
    anchor: "input-management",
    titleZh: "进项管理",
    titleEn: "Input Management",
    summaryZh: "面向进项发票采集、认证抵扣、用途确认与台账协同提供接口能力。",
    summaryEn: "API capabilities for input invoice collection, deduction, usage confirmation, and ledger collaboration.",
    tagsZh: ["采集", "认证", "抵扣"],
    tagsEn: ["Collect", "Verify", "Deduct"],
  },
  {
    anchor: "iit-management",
    titleZh: "个税管理",
    titleEn: "IIT Management",
    summaryZh: "预置人员、薪酬、专项附加扣除与个税申报协同接口。",
    summaryEn: "Preset APIs for personnel, payroll, special deductions, and individual income tax filing workflows.",
    tagsZh: ["人员", "薪酬", "申报"],
    tagsEn: ["People", "Payroll", "Filing"],
  },
  {
    anchor: "filing-management",
    titleZh: "申报管理",
    titleEn: "Filing Management",
    summaryZh: "支持申报数据准备、申报状态查询、结果回执和税种过程追踪。",
    summaryEn: "Supports filing data preparation, status query, receipt sync, and tax-type process tracking.",
    tagsZh: ["申报", "状态", "回执"],
    tagsEn: ["Filing", "Status", "Receipt"],
  },
  {
    anchor: "leqi-self-use",
    titleZh: "乐企自用",
    titleEn: "Leqi Self-use",
    summaryZh: "为企业自建开票与用票场景预留乐企直连、权限、证书与回调能力。",
    summaryEn: "Reserved capabilities for enterprise self-use Leqi direct connection, authorization, certificates, and callbacks.",
    tagsZh: ["直连", "权限", "回调"],
    tagsEn: ["Direct", "Auth", "Callback"],
  },
  {
    anchor: "leqi-joint-use",
    titleZh: "乐企联用",
    titleEn: "Leqi Joint-use",
    summaryZh: "面向银行、平台和生态合作方，预置交易即开票、统一接入与运营协同能力。",
    summaryEn: "For banks, platforms, and partners, presetting transaction invoicing, unified access, and operations collaboration.",
    tagsZh: ["银行", "平台", "交易开票"],
    tagsEn: ["Bank", "Platform", "Transaction"],
  },
  {
    anchor: "invoice-pool",
    titleZh: "发票池归集",
    titleEn: "Invoice Pool Collection",
    summaryZh: "按主体、来源、税号与业务系统归集票据，形成统一票据池。",
    summaryEn: "Collects invoices by entity, source, tax number, and business system into one invoice pool.",
    tagsZh: ["归集", "票池", "台账"],
    tagsEn: ["Pool", "Collect", "Ledger"],
  },
  {
    anchor: "invoice-verification",
    titleZh: "发票查验",
    titleEn: "Invoice Verification",
    summaryZh: "提供发票真伪查验、查验结果存证与风险提示能力。",
    summaryEn: "Provides invoice authenticity verification, evidence retention, and risk prompts.",
    tagsZh: ["查验", "真伪", "风险"],
    tagsEn: ["Verify", "Authenticity", "Risk"],
  },
  {
    anchor: "invoice-ocr",
    titleZh: "发票OCR",
    titleEn: "Invoice OCR",
    summaryZh: "识别纸票、图片、PDF 与版式文件中的发票要素并结构化输出。",
    summaryEn: "Recognizes invoice fields from paper, image, PDF, and layout files with structured output.",
    tagsZh: ["识别", "结构化", "PDF"],
    tagsEn: ["OCR", "Structured", "PDF"],
  },
  {
    anchor: "fiscal-bill-verification",
    titleZh: "财政票据查验",
    titleEn: "Fiscal Bill Verification",
    summaryZh: "预置财政票据真伪查验、票据信息校验与结果留痕能力。",
    summaryEn: "Preset verification, field validation, and audit trail capabilities for fiscal bills.",
    tagsZh: ["财政票据", "查验", "留痕"],
    tagsEn: ["Fiscal Bill", "Verify", "Audit"],
  },
  {
    anchor: "fiscal-bill-ocr",
    titleZh: "财政票据OCR",
    titleEn: "Fiscal Bill OCR",
    summaryZh: "面向财政票据、电子票据图片与扫描件提供智能识别与要素抽取。",
    summaryEn: "Intelligent recognition and field extraction for fiscal bills, e-bill images, and scanned files.",
    tagsZh: ["财政票据", "OCR", "抽取"],
    tagsEn: ["Fiscal Bill", "OCR", "Extract"],
  },
  {
    anchor: "invoice-layout-download",
    titleZh: "发票版式下载",
    titleEn: "Invoice Layout Download",
    summaryZh: "支持发票 PDF、OFD 等版式文件下载、归档与业务系统回写。",
    summaryEn: "Supports PDF/OFD layout download, archiving, and write-back to business systems.",
    tagsZh: ["OFD", "PDF", "归档"],
    tagsEn: ["OFD", "PDF", "Archive"],
  },
  {
    anchor: "smart-coding",
    titleZh: "智能赋码",
    titleEn: "Smart Coding",
    summaryZh: "根据商品、服务、税收分类与历史开票规则自动推荐税收编码。",
    summaryEn: "Recommends tax classification codes using goods, services, tax categories, and historical rules.",
    tagsZh: ["编码", "推荐", "规则"],
    tagsEn: ["Code", "Recommend", "Rule"],
  },
  {
    anchor: "invoice-cloud-title",
    titleZh: "发票云抬头",
    titleEn: "Invoice Cloud Title",
    summaryZh: "维护客户抬头、税号、地址电话、开户行账号并向开票链路复用。",
    summaryEn: "Maintains customer invoice titles, tax IDs, contact, bank accounts, and reuse in invoicing flows.",
    tagsZh: ["抬头", "客户", "复用"],
    tagsEn: ["Title", "Customer", "Reuse"],
  },
  {
    anchor: "tax-risk-management",
    titleZh: "税务风险管理",
    titleEn: "Tax Risk Management",
    summaryZh: "预置风险指标、规则引擎、预警结果和处置闭环的接口能力。",
    summaryEn: "Preset APIs for risk indicators, rule engine, alerts, and closed-loop remediation.",
    tagsZh: ["指标", "预警", "闭环"],
    tagsEn: ["Indicator", "Alert", "Closure"],
  },
];

type OpenPlatformApiGroup = {
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  accentZh: string;
  accentEn: string;
  items: string[];
};

const OPEN_PLATFORM_API_GROUPS: OpenPlatformApiGroup[] = [
  {
    titleZh: "海关数据",
    titleEn: "Customs Data",
    summaryZh: "覆盖进出口报关单、进口税单、保证金、海关编码与关单比对等外贸数据查询能力。",
    summaryEn: "Customs declarations, import tax bills, deposits, HS codes, and customs declaration comparison APIs.",
    accentZh: "外贸企业数据查询",
    accentEn: "Foreign trade data query",
    items: [
      "出口报关单获取接口",
      "进口报关单获取接口",
      "进口税单获取接口",
      "保证金获取接口",
      "海关编码获取接口",
      "退税商品编码获取接口",
      "下载任务状态查询",
      "导入xml出口报关单",
      "出口关单比较",
    ],
  },
  {
    titleZh: "进项数据",
    titleEn: "Input Invoice Data",
    summaryZh: "支持进项发票归集、查验、异常状态获取和票据 OCR 识别。",
    summaryEn: "Input invoice collection, verification, abnormal invoice retrieval, and OCR recognition.",
    accentZh: "进项票据管理",
    accentEn: "Input invoice management",
    items: ["进项发票获取接口", "进项发票查验接口", "进项异常发票获取接口", "进项票据OCR识别接口"],
  },
  {
    titleZh: "销项数据",
    titleEn: "Output Invoice Data",
    summaryZh: "覆盖销项开具、查询、红冲、作废与记账凭证回推。",
    summaryEn: "Output invoice issuing, query, red reversal, voiding, and voucher write-back.",
    accentZh: "开票全链路",
    accentEn: "Invoicing lifecycle",
    items: [
      "销项发票申请接口",
      "销项发票获取接口",
      "销项发票红冲接口",
      "销项发票作废接口",
      "记账凭证回推接口-XINVOICE.DBACK",
    ],
  },
  {
    titleZh: "退税数据",
    titleEn: "Export Tax Refund Data",
    summaryZh: "面向外贸免退税、海外仓申报、批次下载、状态查询与单证申报预置接口目录。",
    summaryEn: "Export tax refund filing, overseas warehouse filing, batch download, status query, and document declaration APIs.",
    accentZh: "退税申报协同",
    accentEn: "Refund filing collaboration",
    items: [
      "自检申报",
      "正式申报",
      "预配单数据接收",
      "海外仓自检申报",
      "海外仓正式申报状态查询",
      "退税申报批次-汇总数据申请下载接口",
      "退税申报批次-汇总数据查询（下载完成后调用）",
      "自检状态查询",
      "单证申报",
      "其他申报",
      "退税申报批次申请下载接口",
      "退税申报批次数据获取接口",
      "已申报批次基本信息获取接口",
    ],
  },
  {
    titleZh: "企业数据",
    titleEn: "Enterprise Tax Data",
    summaryZh: "同步企业基础信息、纳税人类型、税局违法、财税数据、备案、开通申请与企业用户维护接口。",
    summaryEn: "Enterprise profile, taxpayer type, tax violation, tax-finance data, filing, onboarding, and user maintenance APIs.",
    accentZh: "企业税务数据查询",
    accentEn: "Enterprise tax data query",
    items: [
      "企业信息获取接口",
      "是否一般纳税人查询接口",
      "税局违法企业获取接口",
      "企业财税数据获取接口",
      "企业开通申请接口",
      "企业开通申请结果获取接口",
      "企业备案信息申请下载接口",
      "企业备案信息结果获取接口",
      "企业开通申请接口WEB版",
      "渠道关联企业-续期接口WEB版",
      "添加/更新企业用户",
      "登录获取token",
      "违法企业检查",
    ],
  },
  {
    titleZh: "开票服务",
    titleEn: "E-invoice Service",
    summaryZh: "预置电票平台登录、人脸识别状态判断与二维码获取接口。",
    summaryEn: "E-invoice platform login, face-auth status query, and QR code retrieval APIs.",
    accentZh: "电票平台接入",
    accentEn: "E-invoice platform access",
    items: ["登录电票平台接口", "获取是否需要人脸识别接口", "获取人脸识别二维码接口"],
  },
  {
    titleZh: "其他数据服务",
    titleEn: "Other Data Services",
    summaryZh: "覆盖汇率、海关商品编码、退税文库编码查询与单证附件上传。",
    summaryEn: "Exchange rate query, customs commodity code query, tax-refund library code query, and document attachment upload.",
    accentZh: "公共辅助能力",
    accentEn: "Common data utilities",
    items: ["汇率查询", "查询海关商品编码", "退税文库商品编码查询", "单证附件上传"],
  },
];

const OPEN_PLATFORM_API_DOC_COUNT = OPEN_PLATFORM_API_GROUPS.reduce((sum, group) => sum + group.items.length, 0);

const OPEN_PLATFORM_APP_API_GROUPS: OpenPlatformApiGroup[] = [
  {
    titleZh: "抬头与接入",
    titleEn: "Title and Access",
    summaryZh: "覆盖云抬头、微信抬头、YPT 应用创建与用户登录状态同步能力。",
    summaryEn: "Cloud invoice title, WeChat title, YPT app creation, and user login-state synchronization APIs.",
    accentZh: "app 目录能力",
    accentEn: "App catalog",
    items: ["云抬头", "获取微信抬头", "YPT创建APP", "用户登录状态-入库/更新"],
  },
  {
    titleZh: "OCR 与识别",
    titleEn: "OCR and Recognition",
    summaryZh: "覆盖发票单张、多张混扫、财政发票、表格和二维码识别。",
    summaryEn: "Single invoice, mixed batch, fiscal invoice, table, and QR code recognition APIs.",
    accentZh: "票据结构化",
    accentEn: "Document structuring",
    items: [
      "OCR-单张发票识别",
      "OCR-多张混扫识别",
      "OCR-v2-单张发票识别",
      "OCR-v2-多张混扫识别",
      "OCR-v3-财政发票识别",
      "OCR-v3-表格识别",
      "二维码识别",
    ],
  },
  {
    titleZh: "发票查验与版式",
    titleEn: "Invoice Verification and Layout",
    summaryZh: "覆盖发票查验、税局本地查验、PDF/OFD 版式处理、签章与区块链发票查验。",
    summaryEn: "Invoice verification, local tax-bureau verification, PDF/OFD layout handling, signing, and blockchain invoice verification.",
    accentZh: "查验与版式文件",
    accentEn: "Verification and layout files",
    items: [
      "发票查验",
      "PDF签章",
      "生成版式文件并签章",
      "解析OFD文件至XML",
      "OFD转至PDF",
      "税局-查询发票PDF",
      "税局-本地查验发票",
      "深圳区块链发票查验",
    ],
  },
  {
    titleZh: "发票池与状态",
    titleEn: "Invoice Pool and Status",
    summaryZh: "覆盖发票池明细查询、票面信息查询、发票号码模糊查询与企业发票状态月度更新。",
    summaryEn: "Invoice pool details, full invoice-surface query, fuzzy invoice-number query, and monthly enterprise invoice status update.",
    accentZh: "票池运营",
    accentEn: "Invoice pool operations",
    items: [
      "月度更新企业发票状态",
      "查询发票池Goods详细信息",
      "查询发票池Head信息",
      "模糊查询发票号码",
      "根据发票号码查询发票全票面信息",
      "发票池查询",
    ],
  },
  {
    titleZh: "财政票据",
    titleEn: "Fiscal Bills",
    summaryZh: "覆盖财政票据查询、江苏财政票据查询、入账状态查询与入账提交。",
    summaryEn: "Fiscal bill query, Jiangsu fiscal bill query, posting-status query, and posting submission APIs.",
    accentZh: "财政电子票据",
    accentEn: "Fiscal e-bills",
    items: [
      "财政票据查询",
      "财政票据查询(旧 暂时禁用)",
      "江苏财政票据查询",
      "江苏财政票据-查询是否已入账",
      "江苏财政票据-入账提交",
      "财政票据查验-dxy",
    ],
  },
  {
    titleZh: "企业与税务风控",
    titleEn: "Enterprise and Tax Risk",
    summaryZh: "覆盖企业基本信息、经营异常、税收违法、商品编码与外汇查询。",
    summaryEn: "Enterprise profile, business abnormality, tax violation, commodity code, and foreign exchange query APIs.",
    accentZh: "企业数据查询",
    accentEn: "Enterprise data query",
    items: ["企业基本信息", "经营异常", "税收违法", "商品编码", "查询外汇"],
  },
  {
    titleZh: "金税与捷通",
    titleEn: "Golden Tax and Jietong",
    summaryZh: "覆盖捷通与金税系统之间的数据入库和取数协同。",
    summaryEn: "Data write-in and retrieval collaboration between Jietong and Golden Tax systems.",
    accentZh: "系统协同",
    accentEn: "System collaboration",
    items: ["捷通-金税入库接口", "金税取出捷通数据"],
  },
];

const OPEN_PLATFORM_APP_API_COUNT = OPEN_PLATFORM_APP_API_GROUPS.reduce((sum, group) => sum + group.items.length, 0);
const OPEN_PLATFORM_SYNCED_API_COUNT = OPEN_PLATFORM_API_DOC_COUNT + OPEN_PLATFORM_APP_API_COUNT;

const AI_DIGITAL_EMPLOYEE_CASE_PATH = "/ai-agent/cases/digital-tax-employee";

const AI_DIGITAL_EMPLOYEE_STATS = [
  { value: "90%", labelZh: "人工减少", labelEn: "Manual Work Reduced" },
  { value: "3分钟", labelZh: "合同生成", labelEn: "Contract Drafting" },
  { value: "99%", labelZh: "归档准确率", labelEn: "Archiving Accuracy" },
  { value: "24h", labelZh: "全天候运行", labelEn: "Always-on Runtime" },
];

type AIDigitalEmployeeStep = {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
};

type AIDigitalEmployeeFunctionCard = {
  icon: string;
  badge: string;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  steps: AIDigitalEmployeeStep[];
  highlightsZh: string[];
  highlightsEn: string[];
  footerStats: Array<{
    valueZh: string;
    valueEn: string;
    labelZh: string;
    labelEn: string;
  }>;
  tone: "contract" | "archive";
};

const AI_DIGITAL_EMPLOYEE_FUNCTIONS: AIDigitalEmployeeFunctionCard[] = [
  {
    icon: "📄",
    badge: "FUNCTION 01",
    titleZh: "合同自动生成",
    titleEn: "Automated Contract Drafting",
    subtitleZh: "输入项目信息后，AI 自动调取模板、填充条款并输出合规合同。",
    subtitleEn:
      "After project inputs are submitted, AI selects templates, fills legal terms, and delivers compliant contracts.",
    steps: [
      {
        titleZh: "录入项目基本信息",
        titleEn: "Input Core Project Data",
        descriptionZh: "填写甲乙双方、项目名称、金额与工期，支持从 ERP 一键导入。",
        descriptionEn:
          "Capture parties, project name, amount, and duration, with one-click import from ERP systems.",
      },
      {
        titleZh: "AI 匹配合同模板",
        titleEn: "AI Template Matching",
        descriptionZh: "根据项目类型自动选择施工、采购或服务模板并匹配适用条款。",
        descriptionEn:
          "AI selects construction, procurement, or service templates and aligns applicable clauses by project type.",
      },
      {
        titleZh: "自动填充并审查",
        titleEn: "Auto-fill & Compliance Check",
        descriptionZh: "自动填充税率、付款节点与违约条款，并完成法规一致性校验。",
        descriptionEn:
          "Rates, milestones, and penalty terms are auto-filled with policy-consistency checks.",
      },
      {
        titleZh: "一键输出与归档",
        titleEn: "One-click Export & Archive",
        descriptionZh: "输出 Word+PDF 并归入合同台账，可对接电子签章系统。",
        descriptionEn:
          "Export Word+PDF, archive into contract ledgers, and connect with e-signature services.",
      },
    ],
    highlightsZh: ["3分钟完成", "合规自动校验", "多模板库", "电子签章", "版本管理"],
    highlightsEn: ["3-minute drafting", "Compliance auto-check", "Multi-template library", "E-signature", "Version control"],
    footerStats: [
      { valueZh: "4h→3min", valueEn: "4h→3min", labelZh: "起草时间", labelEn: "Draft Time" },
      { valueZh: "0", valueEn: "0", labelZh: "漏项风险", labelEn: "Missing Clause Risk" },
      { valueZh: "100%", valueEn: "100%", labelZh: "合规覆盖", labelEn: "Compliance Coverage" },
    ],
    tone: "contract",
  },
  {
    icon: "🗂️",
    badge: "FUNCTION 02",
    titleZh: "验收单智能归档",
    titleEn: "Intelligent Acceptance Archiving",
    subtitleZh: "项目经理上传验收单后，AI 自动识别项目并精准归档，全程无需人工干预。",
    subtitleEn:
      "After upload, AI identifies project context and archives acceptance files automatically without manual handling.",
    steps: [
      {
        titleZh: "上传验收单文件",
        titleEn: "Upload Acceptance Files",
        descriptionZh: "将 PDF 或图片放入指定目录，系统实时监听并秒级触发处理。",
        descriptionEn:
          "Place PDF/image files into watched folders; ingestion is triggered in seconds.",
      },
      {
        titleZh: "OCR 提取关键信息",
        titleEn: "OCR Field Extraction",
        descriptionZh: "自动提取工程名称、合同编号、验收日期与验收类型等核心字段。",
        descriptionEn:
          "Extract project name, contract ID, acceptance date, and acceptance type automatically.",
      },
      {
        titleZh: "智能匹配项目",
        titleEn: "Intelligent Project Matching",
        descriptionZh: "与工程项目库自动比对，支持模糊匹配并对低置信度项发起人工确认。",
        descriptionEn:
          "Cross-match against project repositories with fuzzy matching and human confirmation on low confidence.",
      },
      {
        titleZh: "自动归档与留痕",
        titleEn: "Auto Archive & Trace Log",
        descriptionZh: "按项目、年份和验收类型归档，并自动生成可追溯日志。",
        descriptionEn:
          "Archive by project/year/type and generate traceable logs for full audit trails.",
      },
    ],
    highlightsZh: ["实时监控", "OCR识别", "模糊匹配", "归档日志", "一键追溯"],
    highlightsEn: ["Real-time monitor", "OCR recognition", "Fuzzy match", "Archive logs", "One-click tracing"],
    footerStats: [
      { valueZh: "秒级", valueEn: "Seconds", labelZh: "归档速度", labelEn: "Archive Speed" },
      { valueZh: "99%", valueEn: "99%", labelZh: "归档准确率", labelEn: "Accuracy" },
      { valueZh: "0", valueEn: "0", labelZh: "人工干预", labelEn: "Manual Intervention" },
    ],
    tone: "archive",
  },
];

const AI_DIGITAL_EMPLOYEE_COMPARE = {
  legacyZh: [
    "手工翻找模板并逐条填写，耗时 3-4 小时。",
    "条款遗漏或税率填错，返工频繁。",
    "验收单靠人工逐一归档，目录易错乱。",
    "资质证书到期无人提醒，投标与审计风险高。",
    "下班后无人处理，次日积压。",
  ],
  legacyEn: [
    "Manual template search and clause entry usually take 3-4 hours.",
    "Missed clauses and tax-rate errors often trigger rework.",
    "Acceptance forms rely on manual filing and are easy to misclassify.",
    "No proactive alerts for certificate expiry increases bid/audit risk.",
    "No off-hour handling causes next-day backlog.",
  ],
  aiZh: [
    "输入关键要素，3 分钟自动生成合规合同。",
    "AI 实时校验合规规则，显著降低错误率。",
    "文件上传即触发，秒级归档可追溯。",
    "证书到期提前预警，降低运营风险。",
    "24 小时持续运行，无需值守。",
  ],
  aiEn: [
    "Enter key inputs and generate compliant contracts in 3 minutes.",
    "AI validates policy rules in real time to reduce errors.",
    "Upload-triggered processing archives files in seconds with traceability.",
    "Early warning on certificate expiry reduces operational risk.",
    "24/7 unattended operation keeps workflows moving.",
  ],
};

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
  coverage: { labelZh: "覆盖国家", labelEn: "Coverage", tone: "brand" },
  iit: { labelZh: "个税能力", labelEn: "IIT", tone: "brand" },
  compliance: { labelZh: "合规治理", labelEn: "Compliance", tone: "brand" },
  collection: { labelZh: "档案采集", labelEn: "Collection", tone: "accent" },
  governance: { labelZh: "保管利用", labelEn: "Governance", tone: "neutral" },
  process: { labelZh: "端到端流程", labelEn: "Process", tone: "brand" },
  value: { labelZh: "业务价值", labelEn: "Value", tone: "accent" },
  scenario: { labelZh: "应用场景", labelEn: "Scenarios", tone: "neutral" },
  market: { labelZh: "市场与法规", labelEn: "Market & Rules", tone: "neutral" },
  "policy-map": { labelZh: "政策节点", labelEn: "Policy Timeline", tone: "accent" },
  automation: { labelZh: "自动化作业", labelEn: "Automation", tone: "brand" },
  delivery: { labelZh: "实施保障", labelEn: "Delivery", tone: "accent" },
  data: { labelZh: "数据目录", labelEn: "Data", tone: "brand" },
  channel: { labelZh: "通道能力", labelEn: "Channels", tone: "accent" },
  api: { labelZh: "接口目录", labelEn: "API Catalog", tone: "brand" },
  issue: { labelZh: "开具管理", labelEn: "Issuance", tone: "brand" },
  query: { labelZh: "查询统计", labelEn: "Query & Analytics", tone: "accent" },
  setting: { labelZh: "开具设置", labelEn: "Issuance Settings", tone: "neutral" },
  "receipt-governance": { labelZh: "权限治理", labelEn: "Governance", tone: "brand" },
  "indirect-tax": { labelZh: "间接税", labelEn: "Indirect Tax", tone: "brand" },
  "direct-tax": { labelZh: "直接税", labelEn: "Direct Tax", tone: "accent" },
  "knowledge-base": { labelZh: "知识库", labelEn: "Knowledge Base", tone: "neutral" },
};

type ProductVisualAsset = {
  src: string;
  altZh: string;
  altEn: string;
};

type ProductVideoAsset = {
  src: string;
  poster: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
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
      src: "/ppt-slides/ppt-overseas/slide-020.png",
      altZh: "海外电子发票解决方案自动化开票作业页",
      altEn: "Vietnam e-invoicing automation slide",
    },
    {
      src: "/ppt-slides/ppt-overseas/slide-021.png",
      altZh: "海外电子发票解决方案数据统一管理页",
      altEn: "Vietnam e-invoicing data management slide",
    },
    {
      src: "/ppt-slides/ppt-overseas/slide-030.png",
      altZh: "海外电子发票解决方案保障体系页",
      altEn: "Vietnam e-invoicing safeguards slide",
    },
  ],
  "electronic-receipt-system": [
    {
      src: "/receipt-system/receipt-manual-issue.png",
      altZh: "电子收据系统手工填开票面截图",
      altEn: "Electronic receipt manual issuance screen",
    },
    {
      src: "/receipt-system/receipt-statistics.png",
      altZh: "电子收据系统统计汇总截图",
      altEn: "Electronic receipt statistics screen",
    },
    {
      src: "/receipt-system/receipt-notifications.png",
      altZh: "电子收据系统邮箱通知记录截图",
      altEn: "Electronic receipt notification records screen",
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

const PRODUCT_VIDEO_ASSETS: Record<string, ProductVideoAsset> = {
  "electronic-receipt-system": {
    src: "/receipt-system/videos/receipt-operation-guide.mp4",
    poster: "/receipt-system/receipt-manual-issue.png",
    titleZh: "电子收据系统操作演示",
    titleEn: "Electronic Receipt System Demo",
    descriptionZh:
      "通过 2 分钟演示快速了解首页看板、手工填开、批量开具、查询统计、模板配置与通知记录等核心操作。",
    descriptionEn:
      "A two-minute walkthrough covering the dashboard, manual issuance, batch issuance, query analytics, template setup, and notification records.",
  },
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

function getProductVideo(slug: string, locale: AppLocale) {
  const video = PRODUCT_VIDEO_ASSETS[slug];
  if (!video) return null;

  return {
    src: video.src,
    poster: video.poster,
    title: locale === "zh" ? video.titleZh : video.titleEn,
    description: locale === "zh" ? video.descriptionZh : video.descriptionEn,
    label: locale === "zh" ? "操作演示" : "Demo",
  };
}

function ProductVisual({
  asset,
  className,
  priority = false,
  sizes,
}: {
  asset: { src: string; alt: string };
  className: string;
  priority?: boolean;
  /** 按实际显示宽度告诉浏览器该下载多大的图；不填时浏览器会按 1600px 下载 1920 宽的版本 */
  sizes: string;
}) {
  return (
    <div className={className}>
      <Image src={asset.src} alt={asset.alt} width={1600} height={900} priority={priority} sizes={sizes} />
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
  "leqi-joint-use-solution": {
    labelZh: "乐企联用",
    labelEn: "Leqi Joint Use",
    captionZh: "交易即开票、税银协同与场景金融",
    captionEn: "Transaction-triggered invoicing and bank-tax collaboration",
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
  "leqi-joint-use-solution": [
    {
      src: "/solutions/leqi-joint-use-banking.svg",
      altZh: "农商行乐企联用交易即开票解决方案示意图",
      altEn: "Rural commercial bank Leqi joint-use transaction invoicing solution visual",
    },
    {
      src: "/solutions/leqi-joint-use-banking.svg",
      altZh: "乐企联用税银场景服务闭环示意图",
      altEn: "Leqi joint-use bank-tax scenario service loop visual",
    },
    {
      src: "/solutions/leqi-joint-use-banking.svg",
      altZh: "支付即开票与交易数据价值示意图",
      altEn: "Payment-triggered invoicing and transaction data value visual",
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
  const [data, shortVideos] = await Promise.all([getHomeData(locale), getShortVideos(3)]);
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
  const industryNewsTitle = locale === "zh" ? "行业新闻" : "Industry News";
  const industryNewsMoreLabel = locale === "zh" ? "查看更多" : "View More";
  const industryNewsEmptyLabel = locale === "zh" ? "暂无行业新闻" : "No industry news yet";
  const solutionSectionSubtitle =
    siteConfig?.homeSolutionSectionSubtitle ||
    (locale === "zh" ? "聚焦典型行业场景的方案概要" : "Snapshot of industry-focused solution tracks");
  const aiHomeTitle = locale === "zh" ? "AI财税智能体" : "AI Tax Agent";
  const aiHomeSummary =
    locale === "zh"
      ? "以全球化税务场景为目标，覆盖票据处理、智能申报与税务顾问能力，形成可扩展的智能服务闭环。"
      : "Built for global tax scenarios with integrated capabilities across invoice processing, intelligent filing, and tax advisory.";
  const aiHomeHighlights =
    locale === "zh"
      ? ["多语言识别", "自动申报协同", "政策智能顾问"]
      : ["Multilingual recognition", "Automated filing collaboration", "Policy intelligence advisor"];
  const shortVideoTitle = locale === "zh" ? "案例与能力视频" : "Case and Capability Videos";
  const shortVideoIntro =
    locale === "zh"
      ? "面向企业客户展示泰可思在全球税务、财务分析、票据风控与智能体应用中的典型场景和落地能力。"
      : "Customer-facing videos that present Taxs capabilities across global tax, financial analysis, invoice risk control, and AI-agent applications.";

  return (
    <>
      <HomeMarqueeAd locale={locale} />

      <section className={locale === "en" ? "hero-immersive home-hero-en" : "hero-immersive"}>
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
            <div className="hero-cert-strip">
              <div className="hero-cert-copy">
                <span>{locale === "zh" ? "资质认证" : "Certifications"}</span>
                <strong>{locale === "zh" ? "专业可信的服务底座" : "Trusted Service Foundation"}</strong>
              </div>
              <HeroCarousel
                images={heroImageUrls}
                alt={locale === "zh" ? "泰可思资质认证轮播" : "Taxs certification carousel"}
              />
            </div>
          </div>
          <div className="hero-visual hero-company-media motion-reveal">
            <CompanyIntroVideo locale={locale} variant="hero" />
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

      <section className="container compact-section home-video-section motion-reveal">
        <div className="section-head home-video-head">
          <div>
            <p className="eyebrow">{locale === "zh" ? "客户案例" : "Customer Stories"}</p>
            <h2>{shortVideoTitle}</h2>
          </div>
          <p>{shortVideoIntro}</p>
          <Link className="home-news-more" href={localizePath(locale, "/short-videos")}>
            {locale === "zh" ? "查看全部案例" : "View All Cases"}
          </Link>
        </div>
        {shortVideos.length === 0 ? (
          <p className="home-news-empty">{locale === "zh" ? "暂无案例视频。" : "No case videos yet."}</p>
        ) : (
          <div className="short-video-strip">
            {shortVideos.map((video) => (
              <Link className="short-video-mini" href={localizePath(locale, "/short-videos")} key={video.id}>
                <video src={video.url} poster={video.posterUrl} muted playsInline preload="metadata" />
                <span>{video.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container compact-section motion-reveal">
        <div className="section-head">
          <h2>{industryNewsTitle}</h2>
          <Link className="home-news-more" href={toNewsCategoryHref(locale, "INDUSTRY")}>
            {industryNewsMoreLabel}
          </Link>
        </div>
        <div className="news-list home-news-list">
          {data.industryNews.length === 0 ? (
            <p className="home-news-empty">{industryNewsEmptyLabel}</p>
          ) : (
            data.industryNews.map((item) => (
              <Link key={item.id} href={localizePath(locale, `/news/${item.slug}`)}>
                <div>
                  <div className="news-list-head">
                    <span className={`news-category-pill tone-${item.newsCategory.toLowerCase()}`}>
                      {getNewsCategoryLabel(locale, item.newsCategory)}
                    </span>
                    {item.sourceName ? <span className="news-source">{item.sourceName}</span> : null}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
                <small>{formatDate(item.publishedAt)}</small>
              </Link>
            ))
          )}
        </div>
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
        {locale === "en" ? (
          <div className="esr-home-entry">
            <p><strong>New: {ESR_APP_NAME}</strong> — reconcile export customs declarations with actual marketplace sales.</p>
            <Link className="legal-button" href={ESR_PRODUCT_PATH}>Learn more</Link>
          </div>
        ) : null}
      </section>

      <section className="container compact-section motion-reveal">
        <div className="section-head">
          <h2 className={locale === "en" ? "home-solution-title home-solution-title-en" : "home-solution-title"}>{solutionSectionSubtitle}</h2>
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

      <section className="container compact-section motion-reveal">
        <div className="section-head">
          <h2>{aiHomeTitle}</h2>
          <p className="ai-home-intro">{aiHomeSummary}</p>
        </div>
        <Link className="solution-spotlight-card ai-home-card" href={localizePath(locale, "/ai-agent")}>
          <div className="ai-home-visual">
            <LazyAutoplayVideo
              loop
              src={DATA_ANALYSIS_AGENT_VIDEO_URL}
              poster={DATA_ANALYSIS_AGENT_VIDEO_POSTER_URL}
              ariaLabel={locale === "zh" ? "数据分析智能体平台演示视频" : "Data analysis agent platform demo video"}
            />
          </div>
          <div className="solution-spotlight-body">
            <div className="solution-spotlight-tags">
              {aiHomeHighlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <h3>{locale === "zh" ? "查看 AI 财税智能体能力栏目" : "Explore AI tax agent capabilities"}</h3>
            <p>
              {locale === "zh"
                ? "栏目页按产品中心的浏览结构呈现能力模块、应用场景与价值重点，便于快速定位落地路径。"
                : "The section follows the product-center browsing structure, helping teams quickly map capabilities to implementation scenarios."}
            </p>
            <span className="solution-spotlight-cta">{locale === "zh" ? "进入栏目" : "Open Section"}</span>
          </div>
        </Link>
      </section>

      <section className="container final-cta motion-reveal">
        <p className="eyebrow">{data.site?.homeAboutTitle || (locale === "zh" ? "关于我们" : "About")}</p>
        <p>
          {data.site?.homeAboutContent ||
            (locale === "zh"
              ? "泰可思成立于2018年，核心团队深耕财税行业二十余年，持续推进企业税务数字化与合规治理能力建设。"
              : "Founded in 2018, Taxs is backed by a senior team with over two decades in tax technology, delivering digital tax and compliance transformation." )}
        </p>
        <Link
          className="cta-button"
          href={`${localizePath(locale, "/contact")}#appointment-form`}
          data-track="cta_click"
          data-track-id="home-bottom"
        >
          {locale === "zh" ? "咨询与方案交流" : "Contact for Consultation"}
        </Link>
      </section>

      <HomeAIAssistantDock />
    </>
  );
}

export async function ShortVideosView({ locale }: { locale: AppLocale }) {
  const videos = await getShortVideos();
  const pageTitle = locale === "zh" ? "案例与能力视频" : "Case and Capability Videos";
  const pageSummary =
    locale === "zh"
      ? "集中展示泰可思面向企业客户的产品能力、行业案例与解决方案场景，覆盖财税数字化、票据风控、乐企接入与智能体应用。"
      : "A customer-facing gallery of Taxs product capabilities, industry cases, and solution scenarios across digital tax, invoice risk control, Leqi integration, and AI-agent applications.";

  return (
    <div className="container page-frame short-video-page">
      <section className="page-lead product-page-lead short-video-hero motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "客户案例" : "Customer Stories"}</p>
        <h1>{pageTitle}</h1>
        <p>{pageSummary}</p>
      </section>

      {videos.length === 0 ? (
        <section className="short-video-empty motion-reveal">
          <h2>{locale === "zh" ? "暂无短视频" : "No Videos Yet"}</h2>
          <p>{locale === "zh" ? "把 MP4 文件上传到服务器短视频目录后，本页会自动展示。" : "Upload MP4 files to the video directory and they will appear here automatically."}</p>
        </section>
      ) : (
        <section className="short-video-grid motion-reveal">
          {videos.map((video, index) => (
            <article className="short-video-card" key={video.id}>
              <div className="short-video-player">
                <video controls preload="metadata" playsInline src={video.url} poster={video.posterUrl} />
              </div>
              <div className="short-video-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{video.title}</h2>
                  <p>
                    {formatDate(video.updatedAt)} · {formatFileSize(video.size)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function OpenPlatformView({ locale }: { locale: AppLocale }) {
  const capabilityCount = OPEN_PLATFORM_CAPABILITIES.length;
  const flowSteps =
    locale === "zh"
      ? [
          ["01", "申请开通", "确认业务场景、主体资质与接口范围。"],
          ["02", "沙箱联调", "获取应用凭证，完成签名、回调与异常链路调试。"],
          ["03", "生产上线", "配置权限、限流、安全策略与业务监控。"],
          ["04", "持续运营", "按接口文档、错误码和日志持续优化调用质量。"],
        ]
      : [
          ["01", "Apply", "Confirm scenarios, entities, and API scope."],
          ["02", "Sandbox", "Obtain credentials and test signatures, callbacks, and exceptions."],
          ["03", "Go Live", "Configure permissions, rate limits, security, and monitoring."],
          ["04", "Operate", "Improve call quality with docs, error codes, and logs."],
        ];

  return (
    <div className="container page-frame open-platform-page">
      <section className="open-platform-hero motion-reveal">
        <div className="open-platform-hero-copy">
          <p className="eyebrow">{locale === "zh" ? "开放平台" : "Open Platform"}</p>
          <h1>{locale === "zh" ? "把票税财能力开放给业务系统与生态伙伴" : "Open tax and invoice capabilities to business systems and partners"}</h1>
          <p>
            {locale === "zh"
              ? "预置销项开票、进项管理、申报、乐企接入、票据查验、OCR 与税务风险等 API 能力，后续接口文档可按能力逐步补充。"
              : "Preset API capabilities for invoicing, input management, filing, Leqi integration, verification, OCR, and tax risk management. Detailed documents can be added capability by capability."}
          </p>
          <div className="hero-actions">
            <a className="cta-button" href="#api-capabilities">
              {locale === "zh" ? "查看 API 能力" : "Explore APIs"}
            </a>
            <Link
              className="ghost-link"
              href={`${localizePath(locale, "/contact")}#appointment-form`}
              data-track="cta_click"
              data-track-id="open-platform-hero"
            >
              {locale === "zh" ? "联系接入顾问" : "Contact Integration"}
            </Link>
          </div>
        </div>
        <div className="open-platform-visual" aria-hidden="true">
          <div className="open-platform-core">
            <span>TAXS</span>
            <strong>OPEN API</strong>
          </div>
          <span className="open-platform-node node-a">{locale === "zh" ? "发票" : "Invoice"}</span>
          <span className="open-platform-node node-b">{locale === "zh" ? "申报" : "Filing"}</span>
          <span className="open-platform-node node-c">{locale === "zh" ? "OCR" : "OCR"}</span>
          <span className="open-platform-node node-d">{locale === "zh" ? "风险" : "Risk"}</span>
        </div>
      </section>

      <section className="open-platform-overview motion-reveal" id="api-capabilities">
        <aside className="product-tree">
          <div className="product-tree-card sticky">
            <p className="eyebrow">{locale === "zh" ? "能力目录" : "API Catalog"}</p>
            <h2>{locale === "zh" ? "预置接口能力" : "Preset APIs"}</h2>
            <div className="product-tree-list open-platform-tree-list">
              <a className="product-tree-parent featured" href="#tax-data-query-apis">
                {locale === "zh" ? "税务数据查询接口" : "Tax Data Query APIs"}
              </a>
              <a className="product-tree-parent featured" href="#app-capability-apis">
                {locale === "zh" ? "app 能力接口" : "App Capability APIs"}
              </a>
              {OPEN_PLATFORM_CAPABILITIES.map((item) => (
                <a key={item.anchor} className="product-tree-parent" href={`#${item.anchor}`}>
                  {locale === "zh" ? item.titleZh : item.titleEn}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="open-platform-main">
          <section className="open-platform-summary">
            <div>
              <p className="eyebrow">{locale === "zh" ? "能力开放版图" : "Capability Map"}</p>
              <h2>{locale === "zh" ? "先预置目录，后续逐项挂接接口文档" : "Preset the catalog now, attach API docs over time"}</h2>
            </div>
            <div className="open-platform-metrics">
              <span>
                <strong>{capabilityCount}+</strong>
                {locale === "zh" ? "API 能力" : "API capabilities"}
              </span>
              <span>
                <strong>3</strong>
                {locale === "zh" ? "接入对象：企业/平台/生态" : "Targets: enterprise/platform/ecosystem"}
              </span>
              <span>
                <strong>REST</strong>
                {locale === "zh" ? "文档预留" : "Docs reserved"}
              </span>
              <span>
                <strong>{OPEN_PLATFORM_SYNCED_API_COUNT}</strong>
                {locale === "zh" ? "已同步接口目录" : "Synced API docs"}
              </span>
            </div>
          </section>

          <section className="open-platform-capability-grid">
            {OPEN_PLATFORM_CAPABILITIES.map((item, index) => (
              <article className="open-api-card" id={item.anchor} key={item.anchor}>
                <span className="open-api-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{locale === "zh" ? item.titleZh : item.titleEn}</h3>
                  <p>{locale === "zh" ? item.summaryZh : item.summaryEn}</p>
                </div>
                <div className="open-api-tags">
                  {(locale === "zh" ? item.tagsZh : item.tagsEn).map((tag) => (
                    <span key={`${item.anchor}-${tag}`}>{tag}</span>
                  ))}
                </div>
                <small>{locale === "zh" ? "接口文档待上传" : "API document pending"}</small>
              </article>
            ))}
          </section>

          <section className="open-platform-api-directory" id="tax-data-query-apis">
            <header>
              <div>
                <p className="eyebrow">{locale === "zh" ? "税务数据查询接口" : "Tax Data Query APIs"}</p>
                <h2>{locale === "zh" ? "已同步开放平台其他能力接口" : "Synced additional open-platform API capabilities"}</h2>
              </div>
              <p>
                {locale === "zh"
                  ? "根据公开接口目录整理为 7 个能力分组，先展示可接入范围；接口请求参数、响应示例、错误码和签名规则可在后续文档中逐项展开。"
                  : "Grouped from the public API catalog into seven capability families. Request parameters, response samples, error codes, and signing rules can be expanded in later documents."}
              </p>
            </header>
            <div className="open-platform-api-group-grid">
              {OPEN_PLATFORM_API_GROUPS.map((group, index) => (
                <article className="open-platform-api-group" key={group.titleZh}>
                  <div className="open-platform-api-group-head">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <small>{locale === "zh" ? group.accentZh : group.accentEn}</small>
                      <h3>{locale === "zh" ? group.titleZh : group.titleEn}</h3>
                    </div>
                    <strong>{group.items.length}</strong>
                  </div>
                  <p>{locale === "zh" ? group.summaryZh : group.summaryEn}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={`${group.titleZh}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="open-platform-api-directory open-platform-app-directory" id="app-capability-apis">
            <header>
              <div>
                <p className="eyebrow">{locale === "zh" ? "ShowDoc app 目录" : "ShowDoc App Catalog"}</p>
                <h2>{locale === "zh" ? "app 目录下能力 API 已同步" : "App-folder capability APIs synced"}</h2>
              </div>
              <p>
                {locale === "zh"
                  ? "仅读取 ShowDoc 的 app 目录，过滤全局状态码、token 加密、获取 IP 以及其他同级目录。重复标题按能力去重后展示。"
                  : "Only the ShowDoc app folder is included. Global status code, token encryption, IP query, and sibling folders are excluded. Duplicate titles are deduplicated by capability."}
              </p>
            </header>
            <div className="open-platform-api-group-grid">
              {OPEN_PLATFORM_APP_API_GROUPS.map((group, index) => (
                <article className="open-platform-api-group app-api-group" key={group.titleZh}>
                  <div className="open-platform-api-group-head">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <small>{locale === "zh" ? group.accentZh : group.accentEn}</small>
                      <h3>{locale === "zh" ? group.titleZh : group.titleEn}</h3>
                    </div>
                    <strong>{group.items.length}</strong>
                  </div>
                  <p>{locale === "zh" ? group.summaryZh : group.summaryEn}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={`${group.titleZh}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="open-platform-flow motion-reveal">
        <header>
          <p className="eyebrow">{locale === "zh" ? "接入流程" : "Integration Flow"}</p>
          <h2>{locale === "zh" ? "从场景确认到生产上线" : "From scenario confirmation to production launch"}</h2>
        </header>
        <div className="open-platform-flow-grid">
          {flowSteps.map(([index, title, description]) => (
            <article key={index}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="open-platform-doc-note motion-reveal">
        <div>
          <p className="eyebrow">{locale === "zh" ? "文档预留位" : "Document Slot"}</p>
          <h2>{locale === "zh" ? "后续接口文档可按能力逐项补充" : "Detailed API documents can be added capability by capability"}</h2>
          <p>
            {locale === "zh"
              ? "当前已同步税务数据查询接口目录与 ShowDoc app 目录能力。每个能力后续可继续挂接接口说明、请求参数、响应示例、错误码、回调说明、沙箱调试与安全签名规则。"
              : "The tax data query catalog and ShowDoc app-folder capabilities have been synced. Each capability can later attach endpoint descriptions, request parameters, response samples, error codes, callback notes, sandbox testing, and signature rules."}
          </p>
        </div>
        <Link
          className="cta-button"
          href={`${localizePath(locale, "/contact")}#appointment-form`}
          data-track="cta_click"
          data-track-id="open-platform-bottom"
        >
          {locale === "zh" ? "预约接口接入" : "Request API Access"}
        </Link>
      </section>
    </div>
  );
}

export function AIAgentView({ locale }: { locale: AppLocale }) {
  return (
    <div className="container page-frame">
      <section className="page-lead product-page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "AI财税智能体" : "AI Tax Agent"}</p>
        <h1>{locale === "zh" ? "全球化财税智能服务中枢" : "Global AI-driven tax service hub"}</h1>
        <p>
          {locale === "zh"
            ? "围绕核心能力模块展示 AI 在票据、申报、顾问场景下的协同价值。"
            : "This section keeps the same style as the product center and presents how AI modules collaborate across invoice, filing, and advisory workflows."}
        </p>
      </section>

      <section className="product-hub motion-reveal">
        <aside className="product-tree">
          <div className="product-tree-card">
            <p className="eyebrow">{locale === "zh" ? "栏目导航" : "Section Menu"}</p>
            <div className="product-tree-list">
              {AI_AGENT_MODULES.map((module) => (
                <div key={module.anchor} className="product-tree-group">
                  <a className="product-tree-parent" href={`#${module.anchor}`}>
                    {locale === "zh" ? module.titleZh : module.titleEn}
                  </a>
                </div>
              ))}
              <div className="product-tree-group">
                <a className="product-tree-parent" href="#data-analysis-agent-platform">
                  {locale === "zh" ? "数据分析智能体平台" : "Data Analysis Agent Platform"}
                </a>
              </div>
              <div className="product-tree-group">
                <Link className="product-tree-parent" href={localizePath(locale, AI_DIGITAL_EMPLOYEE_CASE_PATH)}>
                  {locale === "zh" ? "案例宣传：AI财税数字员工" : "Case: AI Tax Digital Employee"}
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="product-hub-main">
          <section className="product-cluster ai-agent-cluster">
            <header className="product-cluster-head">
              <div>
                <h2>{locale === "zh" ? "核心能力模块" : "Core Capability Modules"}</h2>
              </div>
              <p>
                {locale === "zh"
                  ? "基于 AI 中台与全球税务规则底座，覆盖跨境票据处理、智能申报、顾问服务与风险治理。"
                  : "Based on an AI middle platform and global tax-rule foundation, covering cross-border document processing, intelligent filing, advisory services, and risk governance."}
              </p>
            </header>

            <div className="product-submenu ai-agent-submenu">
              {AI_AGENT_MODULES.map((module, index) => (
                <article className="product-submenu-card ai-agent-card" key={module.anchor} id={module.anchor}>
                  <div className="ai-agent-media">
                    <Image
                      src={module.image}
                      alt={locale === "zh" ? module.titleZh : module.titleEn}
                      width={1600}
                      height={900}
                    />
                  </div>
                  <span className="product-submenu-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{locale === "zh" ? module.titleZh : module.titleEn}</h3>
                    <p>{locale === "zh" ? module.summaryZh : module.summaryEn}</p>
                  </div>
                  <ul className="ai-agent-highlights">
                    {(locale === "zh" ? module.highlightsZh : module.highlightsEn).map((item) => (
                      <li key={`${module.anchor}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="product-cluster ai-agent-data-section" id="data-analysis-agent-platform">
            <header className="product-cluster-head">
              <div>
                <p className="eyebrow">{locale === "zh" ? "智能体应用" : "Agent Application"}</p>
                <h2>{locale === "zh" ? "数据分析智能体平台" : "Data Analysis Agent Platform"}</h2>
              </div>
              <p>
                {locale === "zh"
                  ? "面向企业财税数据、申报过程和风险模型，提供自然语言分析、指标解释、异常识别与经营洞察生成能力。"
                  : "Designed for enterprise tax data, filing workflows, and risk models, with natural-language analysis, metric interpretation, anomaly detection, and business insight generation."}
              </p>
            </header>

            <div className="ai-agent-data-showcase">
              <div className="ai-agent-data-copy">
                <div className="solution-spotlight-tags">
                  <span>{locale === "zh" ? "自然语言问数" : "Natural-language Analytics"}</span>
                  <span>{locale === "zh" ? "指标与模型解释" : "Metric and Model Explanation"}</span>
                  <span>{locale === "zh" ? "财税风险洞察" : "Tax Risk Insights"}</span>
                </div>
                <h3>{locale === "zh" ? "把复杂财税数据变成可理解、可追踪的业务结论" : "Turn complex tax data into explainable and traceable business conclusions"}</h3>
                <p>
                  {locale === "zh"
                    ? "平台将税务申报、发票链路、风险模型和经营指标整合到统一分析界面，支持按企业、期间、税种和指标模型快速追问。"
                    : "The platform brings filing data, invoice flows, risk models, and operating metrics into one analytical workspace, enabling follow-up questions by entity, period, tax type, and model."}
                </p>
                <ul className="ai-agent-data-points">
                  {(locale === "zh"
                    ? ["自动识别异常指标并解释原因", "支持报表、风险、发票数据联动分析", "生成可复核的分析结论与处理建议"]
                    : [
                        "Detects abnormal indicators and explains drivers",
                        "Links report, risk, and invoice data for analysis",
                        "Generates reviewable conclusions and action suggestions",
                      ]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="ai-agent-data-video">
                <video controls preload="metadata" playsInline src={DATA_ANALYSIS_AGENT_VIDEO_URL} />
              </div>
            </div>
          </section>

          <section className="product-cluster ai-agent-case-entry">
            <header className="product-cluster-head">
              <div>
                <h2>{locale === "zh" ? "案例宣传" : "Case Spotlight"}</h2>
              </div>
              <p>
                {locale === "zh"
                  ? "新增 AI 财税数字员工案例页，展示合同自动生成与验收单智能归档的落地路径。"
                  : "Added a dedicated AI Tax Digital Employee case page that demonstrates contract automation and intelligent acceptance archiving."}
              </p>
            </header>

            <Link className="solution-spotlight-card ai-agent-case-link" href={localizePath(locale, AI_DIGITAL_EMPLOYEE_CASE_PATH)}>
              <div className="ai-home-visual">
                <Image
                  src={AI_AGENT_VISUALS[1]}
                  alt={locale === "zh" ? "AI财税数字员工案例预览图" : "AI tax digital employee case preview"}
                  width={1600}
                  height={900}
                />
              </div>
              <div className="solution-spotlight-body">
                <div className="solution-spotlight-tags">
                  <span>{locale === "zh" ? "合同自动生成" : "Contract Automation"}</span>
                  <span>{locale === "zh" ? "智能归档" : "Intelligent Archiving"}</span>
                  <span>{locale === "zh" ? "效率对比" : "Efficiency Benchmark"}</span>
                </div>
                <h3>{locale === "zh" ? "查看案例宣传页" : "Open Case Page"}</h3>
                <p>
                  {locale === "zh"
                    ? "页面包含流程步骤、核心指标与传统方式对比，可直接用于客户演示。"
                    : "The page includes workflow steps, KPI highlights, and legacy-vs-AI comparison for customer demos."}
                </p>
                <span className="solution-spotlight-cta">{locale === "zh" ? "进入案例页" : "View Case"}</span>
              </div>
            </Link>
          </section>
        </div>
      </section>

      <section className="product-bottom-cta motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "继续了解" : "Next Step"}</p>
        <h2>{locale === "zh" ? "想看 AI 财税智能体怎样接入你的业务？" : "Want to see the AI tax agent on your own workflows?"}</h2>
        <p>
          {locale === "zh"
            ? "留下企业信息，我们会结合你的票据、申报和数据分析场景安排演示。"
            : "Leave your company details and we will arrange a demo around your invoicing, filing, and analytics scenarios."}
        </p>
        <div className="hero-actions">
          <Link
            className="cta-button"
            href={`${localizePath(locale, "/contact")}#appointment-form`}
            data-track="cta_click"
            data-track-id="ai-agent-bottom"
          >
            {locale === "zh" ? "预约演示" : "Book a Demo"}
          </Link>
          <Link className="ghost-link product-dark-link" href={localizePath(locale, "/products")}>
            {locale === "zh" ? "查看全部产品" : "All Products"}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function AIAgentDigitalEmployeeCaseView({ locale }: { locale: AppLocale }) {
  return (
    <div className="container page-frame ai-case-page">
      <section className="page-lead product-page-lead motion-reveal ai-case-hero">
        <p className="eyebrow">{locale === "zh" ? "AI财税智能体案例" : "AI Tax Agent Case"}</p>
        <h1>{locale === "zh" ? "AI财税数字员工" : "AI Tax Digital Employee"}</h1>
        <p>
          {locale === "zh"
            ? "聚焦合同自动生成与验收单智能归档两大场景，构建财税作业全流程无人值守能力。"
            : "Focused on automated contract drafting and intelligent acceptance archiving to enable unattended tax operations."}
        </p>
        <div className="ai-case-stats-grid">
          {AI_DIGITAL_EMPLOYEE_STATS.map((item) => (
            <article key={item.labelZh} className="ai-case-stat">
              <strong>{item.value}</strong>
              <span>{locale === "zh" ? item.labelZh : item.labelEn}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-case-function-grid motion-reveal">
        {AI_DIGITAL_EMPLOYEE_FUNCTIONS.map((item) => (
          <article className={`ai-case-function-card tone-${item.tone}`} key={item.titleZh}>
            <header className="ai-case-function-head">
              <span className="ai-case-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <small>{item.badge}</small>
                <h2>{locale === "zh" ? item.titleZh : item.titleEn}</h2>
                <p>{locale === "zh" ? item.subtitleZh : item.subtitleEn}</p>
              </div>
            </header>

            <ol className="ai-case-step-list">
              {item.steps.map((step, index) => (
                <li key={`${item.titleZh}-${step.titleZh}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{locale === "zh" ? step.titleZh : step.titleEn}</strong>
                    <p>{locale === "zh" ? step.descriptionZh : step.descriptionEn}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="ai-case-highlight-list">
              {(locale === "zh" ? item.highlightsZh : item.highlightsEn).map((highlight) => (
                <span key={`${item.titleZh}-${highlight}`}>{highlight}</span>
              ))}
            </div>

            <div className="ai-case-footer-stats">
              {item.footerStats.map((stat) => (
                <div key={`${item.titleZh}-${stat.labelZh}`}>
                  <strong>{locale === "zh" ? stat.valueZh : stat.valueEn}</strong>
                  <span>{locale === "zh" ? stat.labelZh : stat.labelEn}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="ai-case-compare motion-reveal">
        <header className="ai-case-compare-head">
          <p className="eyebrow">{locale === "zh" ? "效率对比" : "Efficiency Comparison"}</p>
          <h2>{locale === "zh" ? "传统方式 vs AI数字员工" : "Legacy Workflow vs AI Digital Employee"}</h2>
          <p>
            {locale === "zh"
              ? "同样的人力投入下，AI 数字员工可显著缩短处理时长并降低合规风险。"
              : "With similar staffing inputs, the AI digital employee shortens processing time and lowers compliance risk."}
          </p>
        </header>

        <div className="ai-case-compare-grid">
          <article className="ai-case-compare-col legacy">
            <h3>{locale === "zh" ? "传统方式" : "Legacy Workflow"}</h3>
            <ul>
              {(locale === "zh" ? AI_DIGITAL_EMPLOYEE_COMPARE.legacyZh : AI_DIGITAL_EMPLOYEE_COMPARE.legacyEn).map(
                (item) => (
                  <li key={item}>{item}</li>
                ),
              )}
            </ul>
          </article>

          <article className="ai-case-compare-col ai">
            <h3>{locale === "zh" ? "AI数字员工" : "AI Digital Employee"}</h3>
            <ul>
              {(locale === "zh" ? AI_DIGITAL_EMPLOYEE_COMPARE.aiZh : AI_DIGITAL_EMPLOYEE_COMPARE.aiEn).map(
                (item) => (
                  <li key={item}>{item}</li>
                ),
              )}
            </ul>
          </article>
        </div>

        <footer className="ai-case-bottom-cta">
          <p>
            {locale === "zh"
              ? "让 AI 处理高频重复作业，让团队专注高价值经营决策。"
              : "Let AI handle repetitive work so teams can focus on high-value decisions."}
          </p>
          <div className="hero-actions">
            <Link
              className="cta-button"
              href={`${localizePath(locale, "/contact")}#appointment-form`}
              data-track="cta_click"
              data-track-id="ai-case-bottom"
            >
              {locale === "zh" ? "预约案例演示" : "Book a Demo"}
            </Link>
            <Link className="ghost-link product-dark-link" href={localizePath(locale, "/ai-agent")}>
              {locale === "zh" ? "返回智能体栏目" : "Back to AI Agent"}
            </Link>
          </div>
        </footer>
      </section>
    </div>
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
              {locale === "en" ? (
                <div className="product-tree-group">
                  <a className="product-tree-parent" href="#cross-border-ecommerce">Cross-border E-commerce</a>
                  <div className="product-tree-children">
                    <Link href={ESR_PRODUCT_PATH}>{ESR_APP_NAME}</Link>
                  </div>
                </div>
              ) : null}
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
          {locale === "en" ? (
            <section id="cross-border-ecommerce" className="product-cluster esr-product-cluster">
              <header className="product-cluster-head">
                <div><h2>Cross-border E-commerce</h2></div>
                <p>Export compliance tools for exporters selling through overseas fulfillment centers.</p>
              </header>
              <div className="product-submenu">
                <Link className="product-submenu-card" href={ESR_PRODUCT_PATH}>
                  <span className="product-submenu-index">01</span>
                  <div><h3>{ESR_APP_NAME}</h3><p>{ESR_PRODUCT_SUMMARY}</p></div>
                </Link>
              </div>
            </section>
          ) : null}
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
                    {visual ? (
                      <ProductVisual
                        asset={visual}
                        className="product-submenu-media"
                        sizes="(max-width: 640px) 92vw, (max-width: 980px) 45vw, 380px"
                      />
                    ) : null}
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
  const productVideo = getProductVideo(product.slug, locale);

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
              {productVideo ? <a href="#product-demo">{productVideo.label}</a> : null}
              {product.sections.map((section, index) => (
                <a key={section.id} href={`#${getSectionAnchor(index)}`}>
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {heroVisual ? (
            <ProductVisual
              asset={heroVisual}
              className="product-hero-visual"
              priority
              sizes="(max-width: 980px) 92vw, 420px"
            />
          ) : null}
        </section>

        {productVideo ? (
          <section className="product-demo-section motion-reveal" id="product-demo">
            <div className="product-demo-copy">
              <span className="product-section-badge tone-accent">{productVideo.label}</span>
              <h2>{productVideo.title}</h2>
              <p>{productVideo.description}</p>
            </div>

            <div className="product-demo-player">
              <video controls preload="metadata" poster={productVideo.poster}>
                <source src={productVideo.src} type="video/mp4" />
                {locale === "zh"
                  ? "当前浏览器不支持视频播放，请更换浏览器查看。"
                  : "Your browser does not support embedded video playback."}
              </video>
            </div>
          </section>
        ) : null}

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

              {section.imageUrl ? (
                <figure className="product-section-visual">
                  <div className="product-section-media">
                    <Image
                      src={section.imageUrl}
                      alt={section.title}
                      width={1400}
                      height={760}
                      unoptimized={section.imageUrl.endsWith(".svg")}
                    />
                  </div>
                </figure>
              ) : null}

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
            <Link
              className="cta-button"
              href={`${localizePath(locale, "/contact")}#appointment-form`}
              data-track="cta_click"
              data-track-id="product-bottom"
            >
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

      <FuelInvoiceDemoCard locale={locale} />

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

      {slug === "leqi-joint-use-solution" ? <FuelInvoiceDemoCard locale={locale} /> : null}

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

      <section className="product-bottom-cta motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "继续了解" : "Next Step"}</p>
        <h2>{locale === "zh" ? "想按你的业务场景看这套方案？" : "Want this solution mapped to your business?"}</h2>
        <p>
          {locale === "zh"
            ? "留下企业信息，我们会按行业、税种和组织模式梳理实施路径，并安排演示。"
            : "Leave your company details and we will outline an implementation path by industry, tax type, and operating model, then arrange a demo."}
        </p>
        <div className="hero-actions">
          <Link
            className="cta-button"
            href={`${localizePath(locale, "/contact")}#appointment-form`}
            data-track="cta_click"
            data-track-id="solution-bottom"
          >
            {locale === "zh" ? "预约演示" : "Book a Demo"}
          </Link>
          <Link className="ghost-link product-dark-link" href={localizePath(locale, "/solutions")}>
            {locale === "zh" ? "返回解决方案" : "Back to Solutions"}
          </Link>
        </div>
      </section>
    </div>
  );
}

export async function NewsView({
  locale,
  category = "ALL",
  page = 1,
  untranslatedNotice = false,
}: {
  locale: AppLocale;
  category?: NewsCategoryParam;
  page?: number;
  untranslatedNotice?: boolean;
}) {
  const result = await getNewsPage(locale, category, page);
  // 超出总页数的页码返回 404，避免产生大量重复的空列表页
  if (page > result.pageCount) {
    notFound();
  }
  const data = result.items;
  const tabs: { key: NewsCategoryParam; label: string }[] = [
    { key: "ALL", label: locale === "zh" ? "全部新闻" : "All News" },
    { key: "COMPANY", label: locale === "zh" ? "公司新闻" : "Company News" },
    { key: "INDUSTRY", label: locale === "zh" ? "行业新闻" : "Industry News" },
  ];

  return (
    <div className="container page-frame">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">{locale === "zh" ? "新闻动态" : "News"}</p>
        <h1>{locale === "zh" ? "产品升级与行业实践" : "Product releases and field practices"}</h1>
      </section>

      {untranslatedNotice ? (
        <p className="notice notice-info" role="status">
          {locale === "zh"
            ? "该文章暂无对应语言版本，已为你打开新闻列表。"
            : "That article is not available in English yet. Here is the English news list."}
        </p>
      ) : null}

      <section className="news-subnav motion-reveal">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            className={tab.key === category ? "active" : ""}
            href={toNewsCategoryHref(locale, tab.key)}
          >
            {tab.label}
          </Link>
        ))}
      </section>

      <section className="news-list motion-reveal">
        {data.map((item) => (
          <Link key={item.id} href={localizePath(locale, `/news/${item.slug}`)}>
            <div>
              <div className="news-list-head">
                <span className={`news-category-pill tone-${item.newsCategory.toLowerCase()}`}>
                  {getNewsCategoryLabel(locale, item.newsCategory)}
                </span>
                {item.sourceName ? <span className="news-source">{item.sourceName}</span> : null}
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
            <small>{formatDate(item.publishedAt)}</small>
          </Link>
        ))}
      </section>

      <NewsPagination locale={locale} category={category} page={result.page} pageCount={result.pageCount} total={result.total} />
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
        <div className="news-meta-row">
          <span className={`news-category-pill tone-${item.newsCategory.toLowerCase()}`}>
            {getNewsCategoryLabel(locale, item.newsCategory)}
          </span>
          {item.sourceName ? <span>{item.sourceName}</span> : null}
          {item.sourceUrl ? (
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" data-track="source_click" data-track-id="news-source">
              {locale === "zh" ? "查看原文" : "Source"}
            </a>
          ) : null}
        </div>
        {item.publishedAt ? <small>{formatDate(item.publishedAt)}</small> : null}
      </section>

      {locale === "en" && !item.hasEnglish ? (
        <p className="notice notice-info" role="status" lang="en">
          This article has not been translated yet. The original Chinese version is shown below.
        </p>
      ) : null}

      <section className="detail-block rich-content news-rich-content motion-reveal">
        <div className="news-content-body">{renderNewsContent(item.content, locale)}</div>
      </section>

      {item.related ? (
        <aside
          className="news-related-entry motion-reveal"
          aria-label={locale === "zh" ? "泰可思相关内容" : "Related content from Taxs"}
          data-track-impression="entry_impression"
          data-track-id="news-related"
          data-track-target={item.related.path}
        >
          <p className="eyebrow">{locale === "zh" ? "延伸阅读 · 泰可思相关内容" : "Further reading · From Taxs"}</p>
          <p className="news-related-note">
            {locale === "zh"
              ? "以下为泰可思自有内容，不属于上述报道。"
              : "The link below is Taxs content and is not part of the report above."}
          </p>
          <Link
            className="news-related-link"
            href={localizePath(locale, item.related.path)}
            data-track="entry_click"
            data-track-id="news-related"
          >
            {item.related.label}
            <span aria-hidden="true"> →</span>
          </Link>
        </aside>
      ) : null}
    </div>
  );
}

export async function StaticPageView({
  locale,
  slug,
  appointmentStatus,
}: {
  locale: AppLocale;
  slug: string;
  appointmentStatus?: string;
}) {
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

      {slug === "about" ? <CompanyIntroVideo locale={locale} variant="about" /> : null}

      <section className="detail-block rich-content motion-reveal">
        <div>{page.content}</div>
      </section>

      {slug === "contact" ? <AppointmentForm locale={locale} nativeStatus={parseNativeSubmitStatus(appointmentStatus)} /> : null}
    </div>
  );
}
