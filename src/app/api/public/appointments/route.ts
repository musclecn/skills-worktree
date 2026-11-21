import { fail, ok } from "@/lib/api";
import {
  normalizeAppointmentAttribution,
  normalizeAppointmentInput,
  normalizeContact,
  validateAppointmentInput,
} from "@/lib/appointment";
import { sendAppointmentBurstAlert, sendAppointmentNotification } from "@/lib/appointment-email";
import {
  APPOINTMENT_LIMITS,
  FLAG_BURST,
  FLAG_DUPLICATE,
  deviceClassFromUserAgent,
  getClientIp,
  hashValue,
  mergeFlags,
} from "@/lib/appointment-guard";
import { prisma } from "@/lib/prisma";

const TOO_MANY = {
  zh: "提交过于频繁，请稍后再试，或直接拨打服务热线。",
  en: "Too many submissions. Please try again later or call our service line.",
} as const;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const raw = typeof body === "object" && body ? (body as Record<string, unknown>) : {};
  const payload = normalizeAppointmentInput(body);
  const locale = payload.locale ?? "zh";

  // 蜜罐字段：正常访客看不到也不会填写，填了就当作已收到但不入库。
  if (typeof raw.website === "string" && raw.website.trim()) {
    return ok({ received: true });
  }

  const validationMessage = validateAppointmentInput(payload, { locale, strictContact: true });
  if (validationMessage) {
    return fail(validationMessage, 422);
  }

  const attribution = normalizeAppointmentAttribution(body);
  const now = new Date();

  // 幂等：同一次提交重试（网络抖动、重复点击）只保留一条。
  if (attribution.submissionId) {
    const existing = await prisma.appointmentRequest.findUnique({
      where: { submissionId: attribution.submissionId },
      select: { id: true, createdAt: true },
    });
    if (existing) {
      return ok({ id: existing.id, createdAt: existing.createdAt, received: true });
    }
  }

  const clientIp = getClientIp(req);
  const ipHash = clientIp ? hashValue(`ip:${clientIp}`) : null;
  if (ipHash) {
    const recentFromIp = await prisma.appointmentRequest.count({
      where: { ipHash, createdAt: { gte: new Date(now.getTime() - APPOINTMENT_LIMITS.ipWindowMs) } },
    });
    if (recentFromIp >= APPOINTMENT_LIMITS.ipMax) {
      return fail(TOO_MANY[locale], 429);
    }
  }

  const contactKey = hashValue(`contact:${normalizeContact(payload.contactInfo)}`);
  const earlierSameContact = await prisma.appointmentRequest.findFirst({
    where: {
      contactKey,
      createdAt: { gte: new Date(now.getTime() - APPOINTMENT_LIMITS.duplicateWindowMs) },
    },
    select: { id: true },
  });
  const isDuplicate = Boolean(earlierSameContact);

  const burstSince = new Date(now.getTime() - APPOINTMENT_LIMITS.burstWindowMs);
  const recentTotal = await prisma.appointmentRequest.count({ where: { createdAt: { gte: burstSince } } });
  const isBurst = recentTotal + 1 >= APPOINTMENT_LIMITS.burstThreshold;
  const crossesBurstThreshold = recentTotal + 1 === APPOINTMENT_LIMITS.burstThreshold;

  let anomalyFlags: string | null = null;
  if (isDuplicate) anomalyFlags = mergeFlags(anomalyFlags, FLAG_DUPLICATE);
  if (isBurst) anomalyFlags = mergeFlags(anomalyFlags, FLAG_BURST);

  const data = await prisma.appointmentRequest.create({
    data: {
      companyName: payload.companyName,
      contactName: payload.contactName,
      contactInfo: payload.contactInfo,
      sourcePage: payload.sourcePage,
      notes: payload.notes,
      topic: payload.topic,
      locale,
      ...attribution,
      ipHash,
      deviceClass: deviceClassFromUserAgent(req.headers.get("user-agent")),
      contactKey,
      reviewStatus: isDuplicate ? "DUPLICATE" : "PENDING",
      anomalyFlags,
    },
  });

  if (isBurst) {
    // 把窗口内先到的记录一并标记，保证“整批”都能被复核人看到。
    const windowRows = await prisma.appointmentRequest.findMany({
      where: { createdAt: { gte: burstSince }, NOT: { id: data.id } },
      select: { id: true, anomalyFlags: true },
    });
    for (const row of windowRows) {
      const merged = mergeFlags(row.anomalyFlags, FLAG_BURST);
      if (merged !== row.anomalyFlags) {
        await prisma.appointmentRequest.update({ where: { id: row.id }, data: { anomalyFlags: merged } });
      }
    }
  }

  if (crossesBurstThreshold) {
    await sendAppointmentBurstAlert({
      count: recentTotal + 1,
      windowMinutes: APPOINTMENT_LIMITS.burstWindowMs / 60000,
      detectedAt: now,
    }).catch((error) => {
      console.error("Failed to send appointment burst alert email", error);
    });
  }

  // 重复和突发期间的提交不逐条通知，避免通知邮箱被刷屏。
  if (!isDuplicate && !isBurst) {
    await sendAppointmentNotification(data).catch((error) => {
      console.error("Failed to send appointment notification email", error);
    });
  }

  return ok({ id: data.id, createdAt: data.createdAt, received: true, duplicate: isDuplicate });
}
