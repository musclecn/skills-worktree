/**
 * 给历史预约记录补“重复”“突发”标记和去重键。
 *
 * 默认只预览（不写库），输出仅有聚合数量，不打印任何联系资料：
 *   npx tsx scripts/backfill-appointment-flags.ts
 * 确认数量无误后再写入：
 *   npx tsx scripts/backfill-appointment-flags.ts --apply
 *
 * 必须在与网站相同的环境变量下运行（DATABASE_URL、SESSION_SECRET 或 APPOINTMENT_HASH_SALT），
 * 否则算出的去重键与线上新提交的记录对不上。写入前请先备份数据库。
 */
import "dotenv/config";
import { planAppointmentBackfill } from "../src/lib/appointment-backfill";
import { FLAG_BURST, FLAG_DUPLICATE, hasFlag } from "../src/lib/appointment-guard";
import { prisma } from "../src/lib/prisma";

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await prisma.appointmentRequest.findMany({
    select: { id: true, contactInfo: true, createdAt: true, contactKey: true, anomalyFlags: true, reviewStatus: true },
  });
  const updates = planAppointmentBackfill(rows);
  const byId = new Map(rows.map((row) => [row.id, row]));

  const finalFlags = rows.map((row) => updates.find((item) => item.id === row.id)?.anomalyFlags ?? row.anomalyFlags);
  const distinctContacts = new Set(
    rows.map((row) => updates.find((item) => item.id === row.id)?.contactKey ?? row.contactKey ?? `row:${row.id}`),
  );

  console.log(`预约记录总数：${rows.length}`);
  console.log(`去重联系方式数：${distinctContacts.size}`);
  console.log(`标为 24 小时内重复：${finalFlags.filter((flags) => hasFlag(flags, FLAG_DUPLICATE)).length}`);
  console.log(`标为突发：${finalFlags.filter((flags) => hasFlag(flags, FLAG_BURST)).length}`);
  console.log(`需要更新的记录：${updates.length}`);
  console.log(
    `其中复核状态由待核改为重复：${updates.filter((item) => item.reviewStatus !== byId.get(item.id)?.reviewStatus).length}`,
  );

  if (!apply) {
    console.log("当前为预览，未写入数据库。确认后加 --apply 执行。");
    return;
  }

  for (const update of updates) {
    await prisma.appointmentRequest.update({
      where: { id: update.id },
      data: { contactKey: update.contactKey, anomalyFlags: update.anomalyFlags, reviewStatus: update.reviewStatus },
    });
  }
  console.log(`已更新 ${updates.length} 条记录。`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
