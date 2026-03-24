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
  runSeed(databaseUrl);
}

main();
