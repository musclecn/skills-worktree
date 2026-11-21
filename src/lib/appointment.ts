import type { AppLocale } from "@/lib/types";

export type AppointmentInput = {
  companyName: string;
  contactName: string;
  contactInfo: string;
  sourcePage?: string | null;
  notes?: string | null;
  topic?: string | null;
  locale?: AppLocale | null;
};

/** 浏览器会话带入的来源链路，不含联系资料。 */
export type AppointmentAttribution = {
  sessionId: string | null;
  landingPath: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  prevPath: string | null;
  articleSlug: string | null;
  productPath: string | null;
  entryId: string | null;
  submissionId: string | null;
};

export const APPOINTMENT_TOPICS = [
  { key: "leqi", zh: "乐企接入与申报", en: "Leqi access & tax filing" },
  { key: "invoice", zh: "发票与进销项管理", en: "Invoice & input/output management" },
  { key: "risk", zh: "税务风险管理", en: "Tax risk management" },
  { key: "archive", zh: "电子会计档案", en: "Electronic accounting archive" },
  { key: "export-rebate", zh: "出口退税", en: "Export tax rebate" },
  { key: "overseas", zh: "海外电子发票", en: "Overseas e-invoicing" },
  { key: "ai-agent", zh: "AI 财税智能体", en: "AI tax agent" },
  { key: "receipt", zh: "电子收据", en: "Electronic receipts" },
  { key: "data-api", zh: "数据服务与开放平台", en: "Data services & open platform" },
  { key: "other", zh: "其他", en: "Other" },
] as const;

export type AppointmentTopicKey = (typeof APPOINTMENT_TOPICS)[number]["key"];

const TOPIC_KEYS = new Set<string>(APPOINTMENT_TOPICS.map((item) => item.key));

export const REVIEW_STATUSES = ["PENDING", "VALID", "INVALID", "DUPLICATE", "TEST"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "待核",
  VALID: "有效",
  INVALID: "无效",
  DUPLICATE: "重复",
  TEST: "测试",
};

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function topicLabel(key: string | null | undefined, locale: AppLocale = "zh") {
  const topic = APPOINTMENT_TOPICS.find((item) => item.key === key);
  return topic ? topic[locale] : "";
}

/** 按访客最近浏览的产品类页面预选咨询方向；匹配不到时返回空。 */
export function topicFromPath(path: string | null | undefined): AppointmentTopicKey | "" {
  if (!path) return "";
  const rules: [RegExp, AppointmentTopicKey][] = [
    [/^\/ai-agent/, "ai-agent"],
    [/^\/open-platform/, "data-api"],
    [/leqi|smart-tax-filing|individual-income-tax/, "leqi"],
    [/tax-risk/, "risk"],
    [/archive/, "archive"],
    [/export-(tax-)?rebate/, "export-rebate"],
    [/global-tax|overseas/, "overseas"],
    [/receipt/, "receipt"],
    [/data-service|open-api/, "data-api"],
    [/invoice|full-ticket|fullticket|yunpiaotong|group-tax/, "invoice"],
  ];
  for (const [pattern, key] of rules) {
    if (pattern.test(path)) return key;
  }
  return "";
}

function pickText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeAppointmentInput(value: unknown): AppointmentInput {
  const body = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const topic = pickText(body.topic);
  return {
    companyName: pickText(body.companyName),
    contactName: pickText(body.contactName),
    contactInfo: pickText(body.contactInfo),
    sourcePage: pickText(body.sourcePage) || null,
    notes: pickText(body.notes) || null,
    topic: TOPIC_KEYS.has(topic) ? topic : null,
    locale: body.locale === "en" ? "en" : body.locale === "zh" ? "zh" : null,
  };
}

function pickPath(value: unknown) {
  const text = pickText(value).split(/[?#]/)[0];
  if (!text.startsWith("/") || text.startsWith("//") || text.length > 200) return null;
  return text;
}

function pickToken(value: unknown, pattern: RegExp) {
  const text = pickText(value);
  return pattern.test(text) ? text : null;
}

export function normalizeAppointmentAttribution(value: unknown): AppointmentAttribution {
  const body = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    sessionId: pickToken(body.sessionId, /^[A-Za-z0-9_-]{8,64}$/),
    landingPath: pickPath(body.landingPath),
    referrerHost: pickToken(body.referrerHost, /^[A-Za-z0-9.-]{1,100}$/),
    utmSource: pickToken(body.utmSource, /^[\w.\-一-鿿]{1,80}$/),
    utmMedium: pickToken(body.utmMedium, /^[\w.\-一-鿿]{1,80}$/),
    utmCampaign: pickToken(body.utmCampaign, /^[\w.\-一-鿿]{1,80}$/),
    prevPath: pickPath(body.prevPath),
    articleSlug: pickToken(body.articleSlug, /^[a-z0-9][a-z0-9-]{0,159}$/),
    productPath: pickPath(body.productPath),
    entryId: pickToken(body.entryId, /^[a-z0-9][a-z0-9_-]{0,59}$/),
    submissionId: pickToken(body.submissionId, /^[A-Za-z0-9_-]{8,64}$/),
  };
}

export type ContactKind = "mobile" | "phone" | "email" | "other";

/**
 * 归一化联系方式，用于去重：全角转半角，去空格、连字符和括号，去国际区号，邮箱转小写。
 */
export function normalizeContact(value: string) {
  const text = value.normalize("NFKC").trim();
  if (text.includes("@")) {
    return text.replace(/\s+/g, "").toLowerCase();
  }
  const compact = text.replace(/[\s\-()（）]/g, "");
  const withoutPrefix = compact.replace(/^(?:\+86|0086|86)(?=1[3-9]\d{9}$)/, "");
  return withoutPrefix.toLowerCase();
}

export function classifyContact(value: string): ContactKind {
  const normalized = normalizeContact(value);
  if (/^1[3-9]\d{9}$/.test(normalized)) return "mobile";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) return "email";
  if (/^\+?\d{7,15}$/.test(normalized)) return "phone";
  return "other";
}

/** 归一化公司名，用于“同一公司多人提交计一条”。 */
export function normalizeCompany(value: string) {
  return value.normalize("NFKC").replace(/[\s()（）,，.。·]/g, "").toLowerCase();
}

const MESSAGES = {
  zh: {
    companyRequired: "请填写公司名称",
    contactNameRequired: "请填写联系人",
    contactInfoRequired: "请填写手机号",
    contactInfoInvalid: "请填写正确的手机号，或填写电话、邮箱",
    companyTooLong: "公司名称长度不能超过120个字符",
    contactNameTooLong: "联系人长度不能超过80个字符",
    contactInfoTooLong: "联系方式长度不能超过120个字符",
    sourceTooLong: "来源页面长度不能超过200个字符",
    notesTooLong: "备注长度不能超过1000个字符",
  },
  en: {
    companyRequired: "Please enter your company name.",
    contactNameRequired: "Please enter a contact person.",
    contactInfoRequired: "Please enter a phone number or email.",
    contactInfoInvalid: "Please enter a valid phone number or email address.",
    companyTooLong: "Company name must be 120 characters or fewer.",
    contactNameTooLong: "Contact person must be 80 characters or fewer.",
    contactInfoTooLong: "Contact details must be 120 characters or fewer.",
    sourceTooLong: "Source page must be 200 characters or fewer.",
    notesTooLong: "Notes must be 1000 characters or fewer.",
  },
} as const;

/**
 * 校验预约内容。`strictContact` 用于公开表单：联系方式必须是手机号、电话或邮箱；
 * 后台编辑历史记录时不启用，以免无法保存旧数据。
 */
export function validateAppointmentInput(
  input: AppointmentInput,
  options: { locale?: AppLocale; strictContact?: boolean } = {},
) {
  const text = MESSAGES[options.locale ?? "zh"];
  if (!input.companyName) return text.companyRequired;
  if (!input.contactName) return text.contactNameRequired;
  if (!input.contactInfo) return text.contactInfoRequired;
  if (input.companyName.length > 120) return text.companyTooLong;
  if (input.contactName.length > 80) return text.contactNameTooLong;
  if (input.contactInfo.length > 120) return text.contactInfoTooLong;
  if (options.strictContact && classifyContact(input.contactInfo) === "other") {
    return text.contactInfoInvalid;
  }
  if (input.sourcePage && input.sourcePage.length > 200) return text.sourceTooLong;
  if (input.notes && input.notes.length > 1000) return text.notesTooLong;

  return null;
}
