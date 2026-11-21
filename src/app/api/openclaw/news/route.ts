import { type NewsCategory, PublishStatus, TranslationStatus } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

type OpenClawNewsPayload = {
  slug?: string;
  title?: string;
  titleZh?: string;
  titleEn?: string;
  summary?: string;
  summaryZh?: string;
  summaryEn?: string;
  content?: string;
  contentZh?: string;
  contentEn?: string;
  coverUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  externalId?: string;
  category?: string;
  publishStatus?: string;
  translationStatus?: string;
  publishedAt?: string;
  sortOrder?: number;
};

const TRACKING_QUERY_KEYS = new Set([
  "spm",
  "from",
  "source",
  "share",
  "sharefrom",
  "sourcefrom",
  "timestamp",
  "ts",
  "_t",
  "wechat",
  "wxfrom",
  "fromapp",
  "fromsource",
]);

function pickString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeSourceUrl(value: string | null | undefined) {
  const raw = pickString(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = "";

    const keptParams: Array<[string, string]> = [];
    parsed.searchParams.forEach((paramValue, paramKey) => {
      const key = paramKey.toLowerCase();
      if (key.startsWith("utm_") || TRACKING_QUERY_KEYS.has(key)) return;
      keptParams.push([paramKey, paramValue]);
    });

    keptParams.sort((a, b) => {
      if (a[0] === b[0]) return a[1].localeCompare(b[1]);
      return a[0].localeCompare(b[0]);
    });

    parsed.search = "";
    for (const [key, paramValue] of keptParams) {
      parsed.searchParams.append(key, paramValue);
    }

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
    }

    return parsed.toString();
  } catch {
    return raw.replace(/#.*$/g, "").replace(/\/+$/g, "");
  }
}

function normalizeComparableText(value: string, maxLength = 320) {
  if (!value) return "";
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .slice(0, maxLength);
}

function textSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const minLength = Math.min(a.length, b.length);
  if (minLength < 8) return 0;

  const left = new Set<string>();
  const right = new Set<string>();

  for (let i = 0; i < a.length - 1; i += 1) {
    left.add(a.slice(i, i + 2));
  }
  for (let i = 0; i < b.length - 1; i += 1) {
    right.add(b.slice(i, i + 2));
  }

  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return (2 * intersection) / (left.size + right.size);
}

function hasCommonSubstringAtLeast(a: string, b: string, minLength: number) {
  if (!a || !b || minLength <= 0) return false;
  if (a.length < minLength || b.length < minLength) return false;

  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  for (let i = 0; i <= shorter.length - minLength; i += 1) {
    const slice = shorter.slice(i, i + minLength);
    if (longer.includes(slice)) return true;
  }
  return false;
}

function toDayKey(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function isWithinDays(a: Date, b: Date, days: number) {
  return Math.abs(a.getTime() - b.getTime()) <= days * 24 * 60 * 60 * 1000;
}

function buildTitleSignature(titleZh: string, titleEn: string) {
  return normalizeComparableText(pickString(titleZh) || pickString(titleEn), 160);
}

function buildContentSignature(contentZh: string, summaryZh: string, contentEn: string, summaryEn: string) {
  return normalizeComparableText(
    pickString(contentZh) || pickString(summaryZh) || pickString(contentEn) || pickString(summaryEn),
    360,
  );
}

type NormalizedIngestPayload = ReturnType<typeof normalizeItem>;

type NewsCandidate = {
  id: string;
  slug: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string | null;
  summaryEn: string | null;
  contentZh: string;
  contentEn: string;
  publishedAt: Date | null;
  sourceUrl: string | null;
};

type ExistingTarget = {
  id: string;
  slug: string;
};

function buildBatchDedupeKey(payload: NormalizedIngestPayload) {
  const titleSignature = buildTitleSignature(payload.titleZh, payload.titleEn);
  const contentSignature = buildContentSignature(
    payload.contentZh,
    payload.summaryZh,
    payload.contentEn,
    payload.summaryEn,
  );
  return (
    payload.externalId ||
    payload.sourceUrl ||
    `${payload.newsCategory}:${contentSignature.slice(0, 180)}:${toDayKey(payload.publishedAt)}:${titleSignature.slice(0, 48)}`
  );
}

function isSemanticDuplicate(payload: NormalizedIngestPayload, candidate: NewsCandidate) {
  const incomingSourceUrl = normalizeSourceUrl(payload.sourceUrl);
  const existingSourceUrl = normalizeSourceUrl(candidate.sourceUrl);
  if (incomingSourceUrl && existingSourceUrl && incomingSourceUrl === existingSourceUrl) {
    return true;
  }

  const incomingTitle = buildTitleSignature(payload.titleZh, payload.titleEn);
  const existingTitle = buildTitleSignature(candidate.titleZh, candidate.titleEn);
  const incomingContent = buildContentSignature(payload.contentZh, payload.summaryZh, payload.contentEn, payload.summaryEn);
  const existingContent = buildContentSignature(
    candidate.contentZh,
    candidate.summaryZh || "",
    candidate.contentEn,
    candidate.summaryEn || "",
  );
  const contentMatch =
    Boolean(incomingContent) &&
    Boolean(existingContent) &&
    (incomingContent === existingContent ||
      incomingContent.includes(existingContent) ||
      existingContent.includes(incomingContent) ||
      incomingContent.startsWith(existingContent) ||
      existingContent.startsWith(incomingContent));
  const contentSimilar =
    Boolean(incomingContent) &&
    Boolean(existingContent) &&
    textSimilarity(incomingContent, existingContent) >= 0.85;

  const sameDay =
    Boolean(payload.publishedAt) &&
    Boolean(candidate.publishedAt) &&
    toDayKey(payload.publishedAt) === toDayKey(candidate.publishedAt);

  const closePublishedAt =
    Boolean(payload.publishedAt) &&
    Boolean(candidate.publishedAt) &&
    isWithinDays(payload.publishedAt as Date, candidate.publishedAt as Date, 7);

  const titleSimilar =
    Boolean(incomingTitle) &&
    Boolean(existingTitle) &&
    (incomingTitle === existingTitle ||
      incomingTitle.includes(existingTitle) ||
      existingTitle.includes(incomingTitle) ||
      textSimilarity(incomingTitle, existingTitle) >= 0.92);
  const titleOverlapByFiveChars =
    Boolean(incomingTitle) &&
    Boolean(existingTitle) &&
    hasCommonSubstringAtLeast(incomingTitle, existingTitle, 5);

  if (contentMatch && (sameDay || closePublishedAt)) return true;
  if (contentSimilar && (sameDay || closePublishedAt)) return true;
  if (titleSimilar && (sameDay || closePublishedAt)) return true;
  if (titleOverlapByFiveChars && (sameDay || closePublishedAt)) return true;
  return false;
}

async function findSemanticDuplicate(payload: NormalizedIngestPayload): Promise<ExistingTarget | null> {
  const candidates = await prisma.newsPost.findMany({
    where: {
      newsCategory: payload.newsCategory,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      slug: true,
      titleZh: true,
      titleEn: true,
      summaryZh: true,
      summaryEn: true,
      contentZh: true,
      contentEn: true,
      publishedAt: true,
      sourceUrl: true,
    },
  });

  const matched = candidates.find((candidate) => isSemanticDuplicate(payload, candidate));
  if (!matched) return null;
  return { id: matched.id, slug: matched.slug };
}

async function updateExistingPost(existingId: string, payload: NormalizedIngestPayload) {
  return prisma.newsPost.update({
    where: { id: existingId },
    data: {
      newsCategory: payload.newsCategory,
      titleZh: payload.titleZh,
      titleEn: payload.titleEn,
      summaryZh: payload.summaryZh || null,
      summaryEn: payload.summaryEn || null,
      contentZh: payload.contentZh,
      contentEn: payload.contentEn,
      coverUrl: payload.coverUrl,
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl,
      externalId: payload.externalId,
      publishStatus: payload.publishStatus,
      translationStatus: payload.translationStatus,
      publishedAt: payload.publishedAt,
      sortOrder: payload.sortOrder,
    },
  });
}

function resolveSecret(req: Request) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = req.headers.get("x-openclaw-token")?.trim() ?? "";
  return bearerToken || headerToken;
}

function normalizeNewsCategory(value: unknown) {
  const normalized = pickString(value).toUpperCase();
  return (normalized === "COMPANY" ? "COMPANY" : "INDUSTRY") as NewsCategory;
}

function normalizePublishStatus(value: unknown) {
  const normalized = pickString(value).toUpperCase();
  if (normalized === PublishStatus.DRAFT) return PublishStatus.DRAFT;
  if (normalized === PublishStatus.ARCHIVED) return PublishStatus.ARCHIVED;
  return PublishStatus.PUBLISHED;
}

function normalizeTranslationStatus(value: unknown, hasBiLanguage: boolean) {
  const normalized = pickString(value).toUpperCase();
  if (normalized === TranslationStatus.DRAFT) return TranslationStatus.DRAFT;
  if (normalized === TranslationStatus.REVIEWED) return TranslationStatus.REVIEWED;
  if (normalized === TranslationStatus.MACHINE_TRANSLATED) return TranslationStatus.MACHINE_TRANSLATED;
  return hasBiLanguage ? TranslationStatus.REVIEWED : TranslationStatus.MACHINE_TRANSLATED;
}

function buildSummary(content: string) {
  if (!content) return "";
  return content.slice(0, 140);
}

async function ensureUniqueSlug(initial: string) {
  const base = initial || `news-${Date.now()}`;
  let candidate = base;
  let index = 2;

  while (true) {
    const exists = await prisma.newsPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${base}-${index}`;
    index += 1;
  }
}

function normalizeItem(item: OpenClawNewsPayload) {
  const collectedAt = new Date();
  const explicitSlug = pickString(item.slug);
  const titleZh = pickString(item.titleZh || item.title);
  const titleEn = pickString(item.titleEn);
  const contentZh = pickString(item.contentZh || item.content);
  const contentEn = pickString(item.contentEn);
  const hasBiLanguage = Boolean(titleZh && titleEn && contentZh && contentEn);

  const finalTitleZh = titleZh || titleEn;
  const finalTitleEn = titleEn || titleZh || finalTitleZh;
  const finalContentZh = contentZh || contentEn;
  const finalContentEn = contentEn || contentZh || finalContentZh;

  const summaryZh = pickString(item.summaryZh || item.summary) || buildSummary(finalContentZh);
  const summaryEn = pickString(item.summaryEn) || buildSummary(finalContentEn);

  const proposedSlug = toSlug(
    explicitSlug || pickString(item.externalId) || pickString(item.sourceUrl) || finalTitleZh || finalTitleEn,
  );

  return {
    slug: proposedSlug,
    hasExplicitSlug: Boolean(explicitSlug),
    titleZh: finalTitleZh,
    titleEn: finalTitleEn,
    summaryZh,
    summaryEn: summaryEn || summaryZh,
    contentZh: finalContentZh,
    contentEn: finalContentEn || finalContentZh,
    coverUrl: pickString(item.coverUrl) || null,
    sourceName: pickString(item.sourceName) || null,
    sourceUrl: normalizeSourceUrl(item.sourceUrl),
    externalId: pickString(item.externalId) || null,
    newsCategory: normalizeNewsCategory(item.category),
    publishStatus: normalizePublishStatus(item.publishStatus),
    translationStatus: normalizeTranslationStatus(item.translationStatus, hasBiLanguage),
    sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : 0,
    // Frontend date should reflect crawl/ingest day instead of source article day.
    publishedAt: collectedAt,
  };
}

export async function POST(req: Request) {
  const configuredToken = process.env.OPENCLAW_INGEST_TOKEN?.trim();
  if (!configuredToken) {
    return fail("OPENCLAW_INGEST_TOKEN is not configured", 503);
  }

  const requestToken = resolveSecret(req);
  if (!requestToken || requestToken !== configuredToken) {
    return fail("Unauthorized", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return fail("Invalid payload", 422);
  }

  const items = Array.isArray((body as { items?: unknown[] }).items)
    ? ((body as { items: OpenClawNewsPayload[] }).items ?? [])
    : [body as OpenClawNewsPayload];
  if (items.length === 0) {
    return fail("No news items provided", 422);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const batchSeen = new Set<string>();
  const result: Array<{ slug: string; action: "created" | "updated" | "skipped"; reason?: string }> = [];

  for (const rawItem of items) {
    const payload = normalizeItem(rawItem);
    if (!payload.titleZh || !payload.contentZh) {
      skipped += 1;
      result.push({
        slug: payload.slug || "invalid-item",
        action: "skipped",
        reason: "Missing title/content",
      });
      continue;
    }

    const batchKey = buildBatchDedupeKey(payload);
    if (batchSeen.has(batchKey)) {
      skipped += 1;
      result.push({
        slug: payload.slug || "duplicate-item",
        action: "skipped",
        reason: "Duplicate in current batch",
      });
      continue;
    }
    batchSeen.add(batchKey);

    const dedupeRules: Array<{ externalId?: string; sourceUrl?: string; slug?: string }> = [];
    if (payload.externalId) dedupeRules.push({ externalId: payload.externalId });
    if (payload.sourceUrl) dedupeRules.push({ sourceUrl: payload.sourceUrl });
    if (payload.slug) dedupeRules.push({ slug: payload.slug });

    let existing: ExistingTarget | null =
      dedupeRules.length > 0
        ? await prisma.newsPost.findFirst({
            where: { OR: dedupeRules },
            select: { id: true, slug: true },
          })
        : null;

    if (!existing && !payload.hasExplicitSlug) {
      existing = await findSemanticDuplicate(payload);
    }

    if (existing) {
      await updateExistingPost(existing.id, payload);
      updated += 1;
      result.push({ slug: existing.slug, action: "updated" });
      continue;
    }

    const finalSlug = await ensureUniqueSlug(payload.slug);
    const createdItem = await prisma.newsPost.create({
      data: {
        slug: finalSlug,
        newsCategory: payload.newsCategory,
        titleZh: payload.titleZh,
        titleEn: payload.titleEn,
        summaryZh: payload.summaryZh || null,
        summaryEn: payload.summaryEn || null,
        contentZh: payload.contentZh,
        contentEn: payload.contentEn,
        coverUrl: payload.coverUrl,
        sourceName: payload.sourceName,
        sourceUrl: payload.sourceUrl,
        externalId: payload.externalId,
        publishStatus: payload.publishStatus,
        translationStatus: payload.translationStatus,
        publishedAt: payload.publishedAt,
        sortOrder: payload.sortOrder,
      },
    });
    created += 1;
    result.push({ slug: createdItem.slug, action: "created" });
  }

  return ok({
    created,
    updated,
    skipped,
    total: items.length,
    items: result,
  });
}
