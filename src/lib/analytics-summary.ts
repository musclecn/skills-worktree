import { isProductPath, stripLocalePrefix } from "@/lib/analytics";
import { normalizeCompany } from "@/lib/appointment";
import { FLAG_BURST, FLAG_DUPLICATE, hasFlag } from "@/lib/appointment-guard";
import { prisma } from "@/lib/prisma";

/** 把 YYYY-MM-DD 解析为北京时间当日零点。 */
export function parseShanghaiDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(date);
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function countBy(values: (string | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = value?.trim() || "(未记录)";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * 统计周期内的访问与预约汇总。所有比例的分子、分母取同一时间范围；
 * 返回值只有聚合数量，不含公司名、联系人和联系方式。
 * 时间范围为 [from, to)，即包含起始日、不包含结束日的次日零点。
 */
export async function buildAnalyticsSummary(from: Date, toExclusive: Date) {
  const range = { gte: from, lt: toExclusive };

  const [events, appointments] = await Promise.all([
    prisma.siteEvent.findMany({
      where: { createdAt: range },
      select: { sessionId: true, type: true, path: true, articleSlug: true, device: true },
    }),
    prisma.appointmentRequest.findMany({
      where: { createdAt: range },
      select: {
        companyName: true,
        contactKey: true,
        id: true,
        reviewStatus: true,
        anomalyFlags: true,
        topic: true,
        sessionId: true,
        articleSlug: true,
        productPath: true,
        entryId: true,
        referrerHost: true,
        landingPath: true,
      },
    }),
  ]);

  const sessions = new Set<string>();
  const pageCounts = new Map<string, number>();
  const deviceSessions = new Map<string, Set<string>>();
  const productSessions = new Set<string>();
  const productCtaSessions = new Set<string>();
  const articleViewPairs = new Set<string>();
  const entryImpressionPairs = new Set<string>();
  const entryClickPairs = new Set<string>();
  const sourceClickPairs = new Set<string>();
  const formViewSessions = new Set<string>();
  let pageViews = 0;
  let submitOk = 0;
  let submitFail = 0;
  let langSwitches = 0;

  for (const event of events) {
    sessions.add(event.sessionId);
    const device = event.device || "unknown";
    if (!deviceSessions.has(device)) deviceSessions.set(device, new Set());
    deviceSessions.get(device)?.add(event.sessionId);
    const pair = `${event.sessionId}|${event.articleSlug ?? ""}`;

    switch (event.type) {
      case "page_view":
        pageViews += 1;
        pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
        if (isProductPath(event.path)) productSessions.add(event.sessionId);
        if (event.articleSlug) articleViewPairs.add(pair);
        break;
      case "entry_impression":
        if (event.articleSlug) entryImpressionPairs.add(pair);
        break;
      case "entry_click":
        if (event.articleSlug) entryClickPairs.add(pair);
        break;
      case "source_click":
        if (event.articleSlug) sourceClickPairs.add(pair);
        break;
      case "cta_click":
        if (isProductPath(event.path)) productCtaSessions.add(event.sessionId);
        break;
      case "form_view":
        formViewSessions.add(event.sessionId);
        break;
      case "form_submit_ok":
        submitOk += 1;
        break;
      case "form_submit_fail":
        submitFail += 1;
        break;
      case "lang_switch":
        langSwitches += 1;
        break;
      default:
        break;
    }
  }

  // 分母只取同时有产品浏览记录的会话，保证“点击会话”是“浏览会话”的子集。
  const productCtaWithinViewers = [...productCtaSessions].filter((id) => productSessions.has(id)).length;
  const entryClicksWithinImpressions = [...entryClickPairs].filter((pair) => entryImpressionPairs.has(pair)).length;

  const successful = appointments.filter(
    (item) => item.reviewStatus !== "DUPLICATE" && !hasFlag(item.anomalyFlags, FLAG_BURST),
  );
  const distinctContacts = new Set(appointments.map((item) => item.contactKey || `row:${item.id}`));
  const validCompanies = new Set(
    appointments.filter((item) => item.reviewStatus === "VALID").map((item) => normalizeCompany(item.companyName)),
  );
  const statusCounts = countBy(appointments.map((item) => item.reviewStatus));

  return {
    range: { from: formatShanghaiDate(from), toExclusive: formatShanghaiDate(toExclusive) },
    visits: {
      sessions: sessions.size,
      pageViews,
      byDevice: [...deviceSessions.entries()].map(([key, set]) => ({ key, count: set.size })),
      topPages: [...pageCounts.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      newsDetailViews: articleViewPairs.size,
      langSwitches,
    },
    relatedEntry: {
      // 去重单位：同一会话对同一文章只计一次
      impressions: entryImpressionPairs.size,
      clicks: entryClicksWithinImpressions,
      clickRate: ratio(entryClicksWithinImpressions, entryImpressionPairs.size),
      sourceClicks: sourceClickPairs.size,
      sourceClickRate: ratio(sourceClickPairs.size, articleViewPairs.size),
    },
    productToBooking: {
      // 去重单位：会话
      productSessions: productSessions.size,
      bookingClickSessions: productCtaWithinViewers,
      clickRate: ratio(productCtaWithinViewers, productSessions.size),
    },
    form: {
      viewSessions: formViewSessions.size,
      submitOkEvents: submitOk,
      submitFailEvents: submitFail,
    },
    appointments: {
      rawSubmissions: appointments.length,
      distinctContacts: distinctContacts.size,
      // 成功提交：未命中 24 小时重复和突发标记
      successfulSubmissions: successful.length,
      // 有效线索：销售标为有效，按归一化公司名去重
      validLeads: validCompanies.size,
      duplicateFlagged: appointments.filter((item) => hasFlag(item.anomalyFlags, FLAG_DUPLICATE)).length,
      burstFlagged: appointments.filter((item) => hasFlag(item.anomalyFlags, FLAG_BURST)).length,
      attributionFillRate: ratio(successful.filter((item) => item.sessionId).length, successful.length),
      byStatus: statusCounts,
      byTopic: countBy(successful.map((item) => item.topic)),
      byArticle: countBy(successful.map((item) => item.articleSlug)),
      byProduct: countBy(successful.map((item) => item.productPath)),
      byEntry: countBy(successful.map((item) => item.entryId)),
      byReferrer: countBy(successful.map((item) => item.referrerHost)),
      byLanding: countBy(successful.map((item) => (item.landingPath ? stripLocalePrefix(item.landingPath) : null))),
    },
  };
}

export type AnalyticsSummary = Awaited<ReturnType<typeof buildAnalyticsSummary>>;

/** 默认统计周期：含今天在内的最近 30 天（北京时间）。 */
export function resolveSummaryRange(fromParam?: string | null, toParam?: string | null) {
  const today = parseShanghaiDate(formatShanghaiDate(new Date())) ?? new Date();
  const to = parseShanghaiDate(toParam) ?? today;
  const from = parseShanghaiDate(fromParam) ?? new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  return from < toExclusive ? { from, toExclusive } : { from: to, toExclusive };
}

export function summaryToCsv(summary: AnalyticsSummary) {
  const rows: [string, string, string | number][] = [
    ["周期", "起始日（含）", summary.range.from],
    ["周期", "结束日（不含）", summary.range.toExclusive],
    ["访问", "会话数", summary.visits.sessions],
    ["访问", "页面曝光", summary.visits.pageViews],
    ["访问", "新闻详情曝光（会话×文章）", summary.visits.newsDetailViews],
    ["访问", "语言切换次数", summary.visits.langSwitches],
    ["相关入口", "曝光（会话×文章）", summary.relatedEntry.impressions],
    ["相关入口", "点击（会话×文章）", summary.relatedEntry.clicks],
    ["相关入口", "点击率", summary.relatedEntry.clickRate ?? ""],
    ["相关入口", "查看原文点击（会话×文章）", summary.relatedEntry.sourceClicks],
    ["相关入口", "查看原文点击率", summary.relatedEntry.sourceClickRate ?? ""],
    ["产品到预约", "浏览产品类页面的会话", summary.productToBooking.productSessions],
    ["产品到预约", "其中点击预约入口的会话", summary.productToBooking.bookingClickSessions],
    ["产品到预约", "点击率", summary.productToBooking.clickRate ?? ""],
    ["表单", "看到表单的会话", summary.form.viewSessions],
    ["表单", "提交成功事件", summary.form.submitOkEvents],
    ["表单", "提交失败事件", summary.form.submitFailEvents],
    ["预约", "原始提交数", summary.appointments.rawSubmissions],
    ["预约", "去重联系方式数", summary.appointments.distinctContacts],
    ["预约", "成功提交数", summary.appointments.successfulSubmissions],
    ["预约", "人工确认有效线索数", summary.appointments.validLeads],
    ["预约", "标记为重复", summary.appointments.duplicateFlagged],
    ["预约", "标记为突发", summary.appointments.burstFlagged],
    ["预约", "来源链路填充率", summary.appointments.attributionFillRate ?? ""],
    ...summary.appointments.byStatus.map((item) => ["预约·复核状态", item.key, item.count] as [string, string, number]),
    ...summary.appointments.byTopic.map((item) => ["预约·咨询方向", item.key, item.count] as [string, string, number]),
    ...summary.appointments.byArticle.map((item) => ["预约·来源文章", item.key, item.count] as [string, string, number]),
    ...summary.appointments.byProduct.map((item) => ["预约·最近产品", item.key, item.count] as [string, string, number]),
    ...summary.appointments.byEntry.map((item) => ["预约·入口", item.key, item.count] as [string, string, number]),
    ...summary.visits.topPages.map((item) => ["页面曝光排名", item.key, item.count] as [string, string, number]),
  ];
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return `﻿${[["分组", "指标", "数值"], ...rows].map((row) => row.map(escape).join(",")).join("\n")}`;
}
