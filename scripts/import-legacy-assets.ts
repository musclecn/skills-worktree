import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
]);

const TEXT_EXTENSIONS = new Set([".html", ".htm", ".txt", ".md", ".json", ".xml"]);
const MIME_TYPE_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolveSqliteUrl() {
  return process.env.DATABASE_URL ?? "file:./data/sztaxs.db";
}

function walkFiles(dir: string): string[] {
  const result: string[] = [];
  const queue = [dir];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  }

  return result;
}

function ensureUniqueFilePath(targetPath: string) {
  if (!fs.existsSync(targetPath)) {
    return targetPath;
  }

  const ext = path.extname(targetPath);
  const base = targetPath.slice(0, -ext.length);
  let count = 1;
  while (fs.existsSync(`${base}-${count}${ext}`)) {
    count += 1;
  }
  return `${base}-${count}${ext}`;
}

function extractContactData(samples: string[]) {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const icpRecords = new Set<string>();
  const addresses = new Set<string>();

  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const phoneRegex = /(?:\+?\d[\d()\-\s]{7,}\d)/g;
  const icpRegex = /[^\s"'<>()]*ICP备[^\s"'<>()]*/g;
  const addressRegex = /[^\n]{0,80}(省|市|区|县|路|街|大道|大厦|园区|号)[^\n]{0,80}/g;

  for (const text of samples) {
    for (const item of text.match(emailRegex) ?? []) {
      emails.add(item.trim());
    }
    for (const item of text.match(phoneRegex) ?? []) {
      const normalized = item.replace(/\s+/g, " ").trim();
      if (normalized.length >= 8 && normalized.length <= 32) {
        phones.add(normalized);
      }
    }
    for (const item of text.match(icpRegex) ?? []) {
      icpRecords.add(item.trim());
    }
    for (const item of text.match(addressRegex) ?? []) {
      const normalized = item.replace(/\s+/g, " ").trim();
      if (normalized.length >= 6) {
        addresses.add(normalized);
      }
    }
  }

  return {
    emails: [...emails].slice(0, 10),
    phones: [...phones].slice(0, 10),
    icpRecords: [...icpRecords].slice(0, 10),
    addresses: [...addresses].slice(0, 10),
  };
}

async function main() {
  const zipPath = getArgValue("--zip") ?? "/Users/musclecn/Desktop/_OfficialWebsite.zip";
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Zip file not found: ${zipPath}`);
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sztaxs-legacy-"));
  const extractDir = path.join(tmpRoot, "extract");
  fs.mkdirSync(extractDir, { recursive: true });

  execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: "ignore" });
  const allFiles = walkFiles(extractDir);

  const uploadRoot = path.resolve(process.cwd(), "public/uploads/legacy");
  fs.mkdirSync(uploadRoot, { recursive: true });

  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl() });
  const prisma = new PrismaClient({ adapter });

  const importedAssets: string[] = [];
  const textSamples: string[] = [];
  let importedCount = 0;

  for (const sourcePath of allFiles) {
    const ext = path.extname(sourcePath).toLowerCase();
    const normalizedPath = sourcePath.replace(/\\/g, "/").toLowerCase();
    const likelyWebImage = /\/(asset\/image|assets\/images?|images?|img|uploads?)\//.test(
      normalizedPath,
    );
    const excludedAssetPath =
      /\/(drawable|mipmap|res\/|android|kid\/|material|notification|systemui|launcher)\//.test(
        normalizedPath,
      );

    if (IMAGE_EXTENSIONS.has(ext) && likelyWebImage && !excludedAssetPath) {
      const baseName = path.basename(sourcePath).replace(/[^a-zA-Z0-9._-]/g, "-");
      const uniqueTarget = ensureUniqueFilePath(path.join(uploadRoot, baseName));
      fs.copyFileSync(sourcePath, uniqueTarget);

      const relativePublicPath = path.relative(path.resolve(process.cwd(), "public"), uniqueTarget);
      const webPath = `/${relativePublicPath.replace(/\\/g, "/")}`;
      const stat = fs.statSync(uniqueTarget);

      const existing = await prisma.mediaAsset.findFirst({
        where: { path: webPath },
        select: { id: true },
      });

      if (!existing) {
        await prisma.mediaAsset.create({
          data: {
            fileName: path.basename(uniqueTarget),
            originalName: path.basename(sourcePath),
            mimeType: MIME_TYPE_BY_EXT[ext] ?? "application/octet-stream",
            size: stat.size,
            path: webPath,
            url: webPath,
            altZh: "旧站导入素材",
            altEn: "Imported legacy asset",
          },
        });
      }

      importedAssets.push(webPath);
      importedCount += 1;
      continue;
    }

    if (TEXT_EXTENSIONS.has(ext) && !excludedAssetPath) {
      try {
        const content = fs.readFileSync(sourcePath, "utf8");
        if (content.length > 0 && content.length < 120_000) {
          textSamples.push(content);
        }
      } catch {
        // Ignore unreadable text files.
      }
    }
  }

  const contact = extractContactData(textSamples);
  const site = await prisma.siteSetting.findUnique({ where: { id: 1 } });

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {
      email: site?.email || contact.emails[0] || "service@sztaxs.com",
      phone: site?.phone || contact.phones[0] || "(0512)62880577",
      addressZh: site?.addressZh || contact.addresses[0] || "江苏省苏州市工业园区",
      icpRecord: site?.icpRecord || contact.icpRecords[0] || "苏ICP备18061422号-1",
    },
    create: {
      id: 1,
      companyNameZh: "苏州泰可思数据科技有限公司",
      companyNameEn: "Suzhou Taxs Data Technology Co., Ltd.",
      phone: contact.phones[0] || "(0512)62880577",
      email: contact.emails[0] || "service@sztaxs.com",
      addressZh: contact.addresses[0] || "江苏省苏州市工业园区",
      addressEn: "Suzhou Industrial Park, Suzhou, Jiangsu, China",
      icpRecord: contact.icpRecords[0] || "苏ICP备18061422号-1",
      copyrightZh: "版权所有 苏州泰可思数据科技有限公司",
      copyrightEn: "Copyright © Suzhou Taxs Data Technology Co., Ltd.",
    },
  });

  await prisma.$disconnect();

  const reportDir = path.resolve(process.cwd(), "scripts/output");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "legacy-import-report.json");

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        zipPath,
        extractedTo: extractDir,
        importedImageCount: importedCount,
        importedAssets: importedAssets.slice(0, 200),
        contactCandidates: contact,
        scannedFileCount: allFiles.length,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Legacy import finished. Imported ${importedCount} images.`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
