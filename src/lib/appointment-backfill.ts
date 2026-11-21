import { normalizeContact } from "@/lib/appointment";
import { APPOINTMENT_LIMITS, FLAG_BURST, FLAG_DUPLICATE, hashValue, mergeFlags } from "@/lib/appointment-guard";

export type BackfillRow = {
  id: string;
  contactInfo: string;
  createdAt: Date;
  contactKey: string | null;
  anomalyFlags: string | null;
  reviewStatus: string;
};

export type BackfillUpdate = {
  id: string;
  contactKey: string;
  anomalyFlags: string | null;
  reviewStatus: string;
};

/**
 * 按现行规则给历史预约补标记：
 * - 同一联系方式 24 小时内只保留最早一条，其余标为重复；
 * - 任意 5 分钟窗口内达到突发阈值的记录整批标为突发。
 * 只改“待核”记录的复核状态，已人工复核的结论保持不变。
 */
export function planAppointmentBackfill(rows: BackfillRow[]): BackfillUpdate[] {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const keys = sorted.map((row) => hashValue(`contact:${normalizeContact(row.contactInfo)}`));
  const flags = sorted.map((row) => row.anomalyFlags);
  const statuses = sorted.map((row) => row.reviewStatus);

  const keptAt = new Map<string, number>();
  sorted.forEach((row, index) => {
    const key = keys[index];
    const time = row.createdAt.getTime();
    const kept = keptAt.get(key);
    if (kept !== undefined && time - kept < APPOINTMENT_LIMITS.duplicateWindowMs) {
      flags[index] = mergeFlags(flags[index], FLAG_DUPLICATE);
      if (statuses[index] === "PENDING") statuses[index] = "DUPLICATE";
    } else {
      keptAt.set(key, time);
    }
  });

  let start = 0;
  for (let end = 0; end < sorted.length; end += 1) {
    while (sorted[end].createdAt.getTime() - sorted[start].createdAt.getTime() >= APPOINTMENT_LIMITS.burstWindowMs) {
      start += 1;
    }
    if (end - start + 1 >= APPOINTMENT_LIMITS.burstThreshold) {
      for (let index = start; index <= end; index += 1) {
        flags[index] = mergeFlags(flags[index], FLAG_BURST);
      }
    }
  }

  return sorted
    .map((row, index) => ({ id: row.id, contactKey: keys[index], anomalyFlags: flags[index], reviewStatus: statuses[index] }))
    .filter((update, index) => {
      const row = sorted[index];
      return (
        update.contactKey !== row.contactKey ||
        update.anomalyFlags !== row.anomalyFlags ||
        update.reviewStatus !== row.reviewStatus
      );
    });
}
