import { fail, ok } from "@/lib/api";
import { MAX_EVENTS_PER_REQUEST, normalizeSiteEvent } from "@/lib/analytics";
import { deviceClassFromUserAgent, getClientIp, hashValue, isBotUserAgent } from "@/lib/appointment-guard";
import { prisma } from "@/lib/prisma";

/** 单个来源每分钟最多接收的事件数，防止事件表被灌满。只在内存中计数，不落库。 */
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_EVENTS = 120;
const rateBuckets = new Map<string, { resetAt: number; count: number }>();

function allowEvents(key: string, amount: number) {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { resetAt: now + RATE_WINDOW_MS, count: amount });
    return true;
  }
  if (bucket.count + amount > RATE_MAX_EVENTS) return false;
  bucket.count += amount;
  return true;
}

export async function POST(req: Request) {
  const userAgent = req.headers.get("user-agent");
  // 已识别的机器人不入库，直接当作已接收。
  if (isBotUserAgent(userAgent)) {
    return ok({ accepted: 0 });
  }

  const body = (await req.json().catch(() => null)) as { events?: unknown } | null;
  const list = Array.isArray(body?.events) ? body.events : null;
  if (!list) {
    return fail("Invalid payload", 422);
  }

  const events = list
    .slice(0, MAX_EVENTS_PER_REQUEST)
    .map((item) => normalizeSiteEvent(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (events.length === 0) {
    return ok({ accepted: 0 });
  }

  const clientIp = getClientIp(req);
  const rateKey = clientIp ? hashValue(`evt:${clientIp}`) : `sid:${events[0].sessionId}`;
  if (!allowEvents(rateKey, events.length)) {
    return fail("Too many events", 429);
  }

  const device = deviceClassFromUserAgent(userAgent);
  await prisma.siteEvent.createMany({
    data: events.map((event) => ({ ...event, device })),
  });

  return ok({ accepted: events.length });
}
