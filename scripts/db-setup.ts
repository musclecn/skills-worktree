import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Only sqlite file: URLs are supported, received: ${databaseUrl}`);
  }

  const raw = databaseUrl.slice("file:".length).split("?")[0];
  if (raw === ":memory:") {
    throw new Error("DATABASE_URL=:memory: is not supported for db:setup");
  }

  const decoded = decodeURIComponent(raw);
  if (path.isAbsolute(decoded)) {
    return decoded;
  }
  return path.resolve(process.cwd(), decoded);
}

function ensureSchema(databaseUrl: string) {
  const dbFile = resolveSqlitePath(databaseUrl);
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  const db = new Database(dbFile);
  try {
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`)
      .get() as { name?: string } | undefined;

    if (!row?.name) {
      const initSqlPath = path.resolve(process.cwd(), "prisma/init.sql");
      const sql = fs.readFileSync(initSqlPath, "utf8");
      db.exec(sql);
      console.log(`Initialized schema at ${dbFile}`);
    } else {
      console.log(`Schema already exists at ${dbFile}`);
    }

    const siteSettingColumns = db
      .prepare(`PRAGMA table_info("SiteSetting")`)
      .all() as { name: string }[];
    const columnSet = new Set(siteSettingColumns.map((item) => item.name));
    const ensureColumns = [
      "homeHeroImageUrl",
      "homeProductSectionTitleZh",
      "homeProductSectionTitleEn",
      "homeProductSectionSubtitleZh",
      "homeProductSectionSubtitleEn",
      "homeSolutionSectionTitleZh",
      "homeSolutionSectionTitleEn",
      "homeSolutionSectionSubtitleZh",
      "homeSolutionSectionSubtitleEn",
      "homeProductImage1",
      "homeProductImage2",
      "homeProductImage3",
      "homeProductImage4",
      "homeSolutionImage1",
      "homeSolutionImage2",
      "homeSolutionImage3",
    ];

    for (const column of ensureColumns) {
      if (columnSet.has(column)) continue;
      db.exec(`ALTER TABLE "SiteSetting" ADD COLUMN "${column}" TEXT`);
      console.log(`Added column SiteSetting.${column}`);
    }

    const productColumns = db.prepare(`PRAGMA table_info("Product")`).all() as { name: string }[];
    const productColumnSet = new Set(productColumns.map((item) => item.name));
    if (!productColumnSet.has("galleryImages")) {
      db.exec(`ALTER TABLE "Product" ADD COLUMN "galleryImages" TEXT`);
      console.log(`Added column Product.galleryImages`);
    }

    const productSectionColumns = db
      .prepare(`PRAGMA table_info("ProductSection")`)
      .all() as { name: string }[];
    const productSectionColumnSet = new Set(productSectionColumns.map((item) => item.name));
    if (!productSectionColumnSet.has("imageUrl")) {
      db.exec(`ALTER TABLE "ProductSection" ADD COLUMN "imageUrl" TEXT`);
      console.log(`Added column ProductSection.imageUrl`);
    }

    const newsColumns = db.prepare(`PRAGMA table_info("NewsPost")`).all() as { name: string }[];
    const newsColumnSet = new Set(newsColumns.map((item) => item.name));
    if (!newsColumnSet.has("newsCategory")) {
      db.exec(`ALTER TABLE "NewsPost" ADD COLUMN "newsCategory" TEXT NOT NULL DEFAULT 'COMPANY'`);
      console.log(`Added column NewsPost.newsCategory`);
    }
    if (!newsColumnSet.has("sourceName")) {
      db.exec(`ALTER TABLE "NewsPost" ADD COLUMN "sourceName" TEXT`);
      console.log(`Added column NewsPost.sourceName`);
    }
    if (!newsColumnSet.has("sourceUrl")) {
      db.exec(`ALTER TABLE "NewsPost" ADD COLUMN "sourceUrl" TEXT`);
      console.log(`Added column NewsPost.sourceUrl`);
    }
    if (!newsColumnSet.has("externalId")) {
      db.exec(`ALTER TABLE "NewsPost" ADD COLUMN "externalId" TEXT`);
      console.log(`Added column NewsPost.externalId`);
    }

    const appointmentTable = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'AppointmentRequest'`)
      .get() as { name?: string } | undefined;

    if (!appointmentTable?.name) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS "AppointmentRequest" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "companyName" TEXT NOT NULL,
          "contactName" TEXT NOT NULL,
          "contactInfo" TEXT NOT NULL,
          "sourcePage" TEXT,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        )
      `);
      console.log(`Created table AppointmentRequest`);
    }

    const appointmentColumns = db
      .prepare(`PRAGMA table_info("AppointmentRequest")`)
      .all() as { name: string }[];
    const appointmentColumnSet = new Set(appointmentColumns.map((item) => item.name));
    if (!appointmentColumnSet.has("sourcePage")) {
      db.exec(`ALTER TABLE "AppointmentRequest" ADD COLUMN "sourcePage" TEXT`);
      console.log(`Added column AppointmentRequest.sourcePage`);
    }
    if (!appointmentColumnSet.has("notes")) {
      db.exec(`ALTER TABLE "AppointmentRequest" ADD COLUMN "notes" TEXT`);
      console.log(`Added column AppointmentRequest.notes`);
    }

    // 来源链路、防护与人工复核字段（已有数据不受影响，复核状态默认为待核）
    const appointmentExtraColumns: [string, string][] = [
      ["topic", "TEXT"],
      ["locale", "TEXT"],
      ["sessionId", "TEXT"],
      ["landingPath", "TEXT"],
      ["referrerHost", "TEXT"],
      ["utmSource", "TEXT"],
      ["utmMedium", "TEXT"],
      ["utmCampaign", "TEXT"],
      ["prevPath", "TEXT"],
      ["articleSlug", "TEXT"],
      ["productPath", "TEXT"],
      ["entryId", "TEXT"],
      ["submissionId", "TEXT"],
      ["ipHash", "TEXT"],
      ["deviceClass", "TEXT"],
      ["contactKey", "TEXT"],
      ["reviewStatus", "TEXT NOT NULL DEFAULT 'PENDING'"],
      ["anomalyFlags", "TEXT"],
      ["reviewedAt", "DATETIME"],
    ];
    for (const [column, definition] of appointmentExtraColumns) {
      if (appointmentColumnSet.has(column)) continue;
      db.exec(`ALTER TABLE "AppointmentRequest" ADD COLUMN "${column}" ${definition}`);
      console.log(`Added column AppointmentRequest.${column}`);
    }
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentRequest_submissionId_key" ON "AppointmentRequest"("submissionId");
      CREATE INDEX IF NOT EXISTS "AppointmentRequest_createdAt_idx" ON "AppointmentRequest"("createdAt");
      CREATE INDEX IF NOT EXISTS "AppointmentRequest_contactKey_createdAt_idx" ON "AppointmentRequest"("contactKey", "createdAt");
      CREATE INDEX IF NOT EXISTS "AppointmentRequest_ipHash_createdAt_idx" ON "AppointmentRequest"("ipHash", "createdAt");
    `);

    for (const column of ["relatedPath", "relatedLabelZh", "relatedLabelEn"]) {
      if (newsColumnSet.has(column)) continue;
      db.exec(`ALTER TABLE "NewsPost" ADD COLUMN "${column}" TEXT`);
      console.log(`Added column NewsPost.${column}`);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS "SiteEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sessionId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "path" TEXT NOT NULL,
        "locale" TEXT NOT NULL,
        "target" TEXT,
        "entryId" TEXT,
        "articleSlug" TEXT,
        "device" TEXT,
        "referrerHost" TEXT
      );
      CREATE INDEX IF NOT EXISTS "SiteEvent_createdAt_idx" ON "SiteEvent"("createdAt");
      CREATE INDEX IF NOT EXISTS "SiteEvent_type_createdAt_idx" ON "SiteEvent"("type", "createdAt");
      CREATE INDEX IF NOT EXISTS "SiteEvent_sessionId_idx" ON "SiteEvent"("sessionId");
    `);
  } finally {
    db.close();
  }
}

function runSeed(databaseUrl: string) {
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}

function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/sztaxs.db";
  ensureSchema(databaseUrl);
  // 线上发布只补结构、不跑 seed（seed 会覆盖正式内容）：npx tsx scripts/db-setup.ts --schema-only
  if (process.argv.includes("--schema-only")) {
    console.log("Schema-only mode: seed skipped");
    return;
  }
  runSeed(databaseUrl);
}

main();
