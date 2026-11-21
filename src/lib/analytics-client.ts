/**
 * 浏览器端的访问会话与事件上报。
 * 会话标识是标签页内的随机串，30 分钟无操作后重新生成；不写 Cookie，不含联系资料。
 */
import { articleSlugFromPath, isProductPath, stripLocalePrefix, type SiteEventType } from "@/lib/analytics";

const STORAGE_KEY = "sz_visit";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const TRAIL_LIMIT = 10;
const ENDPOINT = "/api/public/events";

type VisitState = {
  id: string;
  lastActiveAt: number;
  landingPath: string;
  referrerHost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  trail: string[];
  productPath: string;
  articleSlug: string;
  entryId: string;
  /** 已上报的去重键 → 时间戳，用于“同一会话只计一次”。 */
  seen: Record<string, number>;
};

type EventPayload = {
  type: SiteEventType;
  path?: string;
  target?: string | null;
  entryId?: string | null;
  articleSlug?: string | null;
};

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.padEnd(16, "0");
}

function readState(): VisitState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisitState) : null;
  } catch {
    return null;
  }
}

function writeState(state: VisitState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 无痕模式或存储被禁用时放弃记录，不影响页面使用。
  }
}

function externalReferrerHost() {
  try {
    if (!document.referrer) return "";
    const host = new URL(document.referrer).host;
    return host && host !== window.location.host ? host : "";
  } catch {
    return "";
  }
}

function createState(): VisitState {
  const params = new URLSearchParams(window.location.search);
  const pick = (key: string) => (params.get(key) ?? "").slice(0, 80);
  return {
    id: randomId(),
    lastActiveAt: Date.now(),
    landingPath: window.location.pathname,
    referrerHost: externalReferrerHost(),
    utmSource: pick("utm_source"),
    utmMedium: pick("utm_medium"),
    utmCampaign: pick("utm_campaign"),
    trail: [],
    productPath: "",
    articleSlug: "",
    entryId: "",
    seen: {},
  };
}

function getState(): VisitState {
  const existing = readState();
  if (existing && Date.now() - existing.lastActiveAt < SESSION_IDLE_MS) {
    existing.lastActiveAt = Date.now();
    return existing;
  }
  return createState();
}

const queue: Record<string, unknown>[] = [];
let flushTimer: number | null = null;

function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.splice(0, 20) });
  try {
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // 上报失败不重试，也不打扰访客。
  }
  if (queue.length > 0) scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(flush, 800);
}

export function flushEvents() {
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
  }
  flush();
}

/**
 * 记录一个事件。`onceKey` 存在时，同一会话内相同的键只上报一次。
 */
export function trackEvent(payload: EventPayload, onceKey?: string) {
  if (typeof window === "undefined") return;
  const state = getState();
  if (onceKey) {
    if (state.seen[onceKey]) {
      writeState(state);
      return;
    }
    state.seen[onceKey] = Date.now();
  }
  writeState(state);

  queue.push({
    sessionId: state.id,
    type: payload.type,
    path: payload.path ?? window.location.pathname,
    target: payload.target ?? null,
    entryId: payload.entryId ?? null,
    articleSlug: payload.articleSlug ?? articleSlugFromPath(window.location.pathname),
    referrerHost: state.referrerHost || null,
  });
  scheduleFlush();
}

/** 页面曝光：更新浏览轨迹，同一会话对同一路径只计一次。 */
export function trackPageView(pathname: string) {
  if (typeof window === "undefined") return;
  const state = getState();
  if (state.trail[state.trail.length - 1] !== pathname) {
    state.trail = [...state.trail, pathname].slice(-TRAIL_LIMIT);
  }
  if (isProductPath(pathname)) {
    state.productPath = stripLocalePrefix(pathname);
  }
  const slug = articleSlugFromPath(pathname);
  if (slug) {
    state.articleSlug = slug;
  }
  writeState(state);
  trackEvent({ type: "page_view", path: pathname, articleSlug: slug }, `pv:${pathname}`);
}

/** 记住访客最近点击的预约入口，提交预约时带上。 */
export function rememberEntry(entryId: string) {
  if (typeof window === "undefined" || !entryId) return;
  const state = getState();
  state.entryId = entryId;
  writeState(state);
}

/** 提交预约时附带的来源链路。 */
export function getAttribution() {
  if (typeof window === "undefined") return {};
  const state = getState();
  writeState(state);
  const current = window.location.pathname;
  const previous = [...state.trail].reverse().find((path) => path !== current) ?? "";
  return {
    sessionId: state.id,
    landingPath: state.landingPath,
    referrerHost: state.referrerHost,
    utmSource: state.utmSource,
    utmMedium: state.utmMedium,
    utmCampaign: state.utmCampaign,
    prevPath: previous,
    articleSlug: state.articleSlug,
    productPath: state.productPath,
    entryId: state.entryId,
  };
}

export function newSubmissionId() {
  return randomId();
}
