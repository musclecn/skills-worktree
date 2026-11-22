import { createHash } from "node:crypto";

/** 预约接口的防护阈值。 */
export const APPOINTMENT_LIMITS = {
  /** 同一 IP 在窗口内最多提交次数，超过返回 429。 */
  ipWindowMs: 10 * 60 * 1000,
  ipMax: 5,
  /** 同一联系方式在窗口内只保留最早一条，其余标为重复。 */
  duplicateWindowMs: 24 * 60 * 60 * 1000,
  /** 全站在窗口内达到该提交数即整批标记为突发并告警一次。 */
  burstWindowMs: 5 * 60 * 1000,
  burstThreshold: 10,
} as const;

export const FLAG_DUPLICATE = "DUPLICATE_24H";
export const FLAG_BURST = "BURST";

function hashSalt() {
  return process.env.APPOINTMENT_HASH_SALT || process.env.SESSION_SECRET || "sztaxs-appointment";
}

/** 不可逆哈希，用于按 IP 或联系方式去重，库内不保存原值以外的可识别信息。 */
export function hashValue(value: string) {
  return createHash("sha256").update(`${hashSalt()}:${value}`).digest("hex").slice(0, 32);
}

/**
 * 访客 IP。线上 Nginx 用 $remote_addr 设置 X-Real-IP，访客无法伪造，优先使用。
 * X-Forwarded-For 由 $proxy_add_x_forwarded_for 追加而成，首项可以被访客随意填写，
 * 所以只作兜底，并取最后一项（离本服务最近的一跳）。
 */
export function getClientIp(req: Request) {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return forwarded.length > 0 ? forwarded[forwarded.length - 1] : "";
}

export function deviceClassFromUserAgent(userAgent: string | null | undefined) {
  const ua = userAgent ?? "";
  if (!ua) return "unknown";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|android|harmonyos/i.test(ua)) return "mobile";
  return "desktop";
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|go-http|scrapy|phantom|puppeteer|playwright|facebookexternalhit|preview/i;

export function isBotUserAgent(userAgent: string | null | undefined) {
  const ua = userAgent ?? "";
  return !ua || BOT_PATTERN.test(ua);
}

export function mergeFlags(existing: string | null | undefined, flag: string) {
  const flags = new Set((existing ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  flags.add(flag);
  return [...flags].join(",");
}

export function hasFlag(existing: string | null | undefined, flag: string) {
  return (existing ?? "").split(",").includes(flag);
}
