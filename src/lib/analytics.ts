/** 站内事件的服务端校验。事件只含会话标识与页面路径，不含联系资料。 */

export const EVENT_TYPES = [
  "page_view",
  "entry_impression",
  "entry_click",
  "cta_click",
  "source_click",
  "lang_switch",
  "form_view",
  "form_submit_ok",
  "form_submit_fail",
] as const;

export type SiteEventType = (typeof EVENT_TYPES)[number];

export type SiteEventInput = {
  sessionId: string;
  type: SiteEventType;
  path: string;
  locale: "zh" | "en";
  target: string | null;
  entryId: string | null;
  articleSlug: string | null;
  referrerHost: string | null;
};

export const MAX_EVENTS_PER_REQUEST = 20;

const TYPE_SET = new Set<string>(EVENT_TYPES);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPath(value: unknown) {
  const raw = text(value).split(/[?#]/)[0];
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.length > 200) return null;
  return raw;
}

function token(value: unknown, pattern: RegExp) {
  const raw = text(value);
  return pattern.test(raw) ? raw : null;
}

/** 目标可以是站内路径，也可以是外部域名（如“查看原文”只记域名）。 */
function cleanTarget(value: unknown) {
  return cleanPath(value) ?? token(value, /^[A-Za-z0-9.-]{1,100}$/);
}

export function normalizeSiteEvent(value: unknown): SiteEventInput | null {
  if (typeof value !== "object" || !value) return null;
  const body = value as Record<string, unknown>;

  const type = text(body.type);
  const sessionId = token(body.sessionId, /^[A-Za-z0-9_-]{8,64}$/);
  const path = cleanPath(body.path);
  if (!TYPE_SET.has(type) || !sessionId || !path) return null;

  return {
    sessionId,
    type: type as SiteEventType,
    path,
    locale: path === "/en" || path.startsWith("/en/") ? "en" : "zh",
    target: cleanTarget(body.target),
    entryId: token(body.entryId, /^[a-z0-9][a-z0-9_-]{0,59}$/),
    articleSlug: token(body.articleSlug, /^[a-z0-9][a-z0-9-]{0,159}$/),
    referrerHost: token(body.referrerHost, /^[A-Za-z0-9.-]{1,100}$/),
  };
}

/** 去掉语言前缀，便于中英文页面按同一栏目归类。 */
export function stripLocalePrefix(path: string) {
  if (path === "/en") return "/";
  return path.startsWith("/en/") ? path.slice(3) : path;
}

/** 产品类页面：产品、AI 智能体、AIGC、解决方案、开放平台。 */
export function isProductPath(path: string) {
  const base = stripLocalePrefix(path);
  return /^\/(products|ai-agent|aigc|solutions|open-platform)(\/|$)/.test(base);
}

export function articleSlugFromPath(path: string) {
  const match = stripLocalePrefix(path).match(/^\/news\/([a-z0-9][a-z0-9-]*)$/);
  return match ? match[1] : null;
}
