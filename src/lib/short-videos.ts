import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const POSTER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const METADATA_FILE_NAME = ".short-videos.meta.json";

type ShortVideoMetadata = Record<
  string,
  {
    title?: string;
    updatedAt?: string;
  }
>;

export type ShortVideoItem = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  posterUrl?: string;
  size: number;
  updatedAt: Date;
};

export function getShortVideoDirectory() {
  return process.env.SHORT_VIDEO_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "short-videos");
}

function getPublicBasePath() {
  const raw = process.env.SHORT_VIDEO_PUBLIC_PATH || "/short-videos";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function getMetadataPath(videoDir = getShortVideoDirectory()) {
  return path.join(videoDir, METADATA_FILE_NAME);
}

function prettifyVideoTitle(fileName: string) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/^\d{8,14}[-_ ]*/, "")
    .replace(/^\d{13}[-_ ]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeShortVideoTitle(value: unknown) {
  const title = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return title.slice(0, 80);
}

function sanitizeFileBase(value: string) {
  const safe = value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 90);
  return safe || "short-video";
}

function safeShortVideoFileName(fileName: string) {
  const decoded = decodeURIComponent(fileName);
  if (decoded !== path.basename(decoded) || decoded.startsWith(".")) {
    throw new Error("Invalid video file name");
  }
  const ext = path.extname(decoded).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported video format");
  }
  return decoded;
}

async function readMetadata(videoDir = getShortVideoDirectory()): Promise<ShortVideoMetadata> {
  try {
    const raw = await readFile(getMetadataPath(videoDir), "utf8");
    const parsed = JSON.parse(raw) as ShortVideoMetadata;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function writeMetadata(metadata: ShortVideoMetadata, videoDir = getShortVideoDirectory()) {
  await mkdir(videoDir, { recursive: true });
  await writeFile(getMetadataPath(videoDir), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

async function findPosterUrl(videoDir: string, publicBasePath: string, fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName));
  for (const ext of POSTER_EXTENSIONS) {
    const posterFileName = `${baseName}${ext}`;
    try {
      await access(path.join(videoDir, posterFileName));
      return `${publicBasePath}/${encodeURIComponent(posterFileName)}`;
    } catch {
      // Try next poster extension.
    }
  }
  return undefined;
}

async function getShortVideoItem(videoDir: string, publicBasePath: string, metadata: ShortVideoMetadata, fileName: string) {
  if (fileName.startsWith(".")) return null;

  const ext = path.extname(fileName).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) return null;

  const filePath = path.join(videoDir, fileName);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) return null;
  const posterUrl = await findPosterUrl(videoDir, publicBasePath, fileName);
  const metadataTitle = normalizeShortVideoTitle(metadata[fileName]?.title);

  return {
    id: fileName,
    title: metadataTitle || prettifyVideoTitle(fileName),
    fileName,
    url: `${publicBasePath}/${encodeURIComponent(fileName)}`,
    ...(posterUrl ? { posterUrl } : {}),
    size: fileStat.size,
    updatedAt: fileStat.mtime,
  } satisfies ShortVideoItem;
}

export async function getShortVideos(limit?: number): Promise<ShortVideoItem[]> {
  const videoDir = getShortVideoDirectory();
  const publicBasePath = getPublicBasePath();

  let entries: string[];
  try {
    entries = await readdir(videoDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const metadata = await readMetadata(videoDir);
  const videos = await Promise.all(entries.map((fileName) => getShortVideoItem(videoDir, publicBasePath, metadata, fileName)));

  const sorted = videos
    .filter((item): item is ShortVideoItem => Boolean(item))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function uploadShortVideo(file: File, title?: string) {
  const originalName = file.name || "short-video.mp4";
  const ext = path.extname(originalName).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("仅支持 mp4、webm、mov、m4v 视频文件");
  }

  const videoDir = getShortVideoDirectory();
  await mkdir(videoDir, { recursive: true });
  const metadata = await readMetadata(videoDir);
  const displayTitle = normalizeShortVideoTitle(title) || prettifyVideoTitle(originalName);
  const safeBase = sanitizeFileBase(displayTitle || path.basename(originalName, ext));
  let fileName = `${Date.now()}-${safeBase}${ext}`;
  let targetPath = path.join(videoDir, fileName);
  let suffix = 1;

  while (true) {
    try {
      await access(targetPath);
      fileName = `${Date.now()}-${safeBase}-${suffix}${ext}`;
      targetPath = path.join(videoDir, fileName);
      suffix += 1;
    } catch {
      break;
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(targetPath, buffer);
  metadata[fileName] = { title: displayTitle, updatedAt: new Date().toISOString() };
  await writeMetadata(metadata, videoDir);

  const item = await getShortVideoItem(videoDir, getPublicBasePath(), metadata, fileName);
  if (!item) throw new Error("视频上传后读取失败");
  return item;
}

export async function updateShortVideoTitle(fileName: string, title: string) {
  const safeName = safeShortVideoFileName(fileName);
  const normalizedTitle = normalizeShortVideoTitle(title);
  if (!normalizedTitle) {
    throw new Error("视频标题不能为空");
  }

  const videoDir = getShortVideoDirectory();
  const filePath = path.join(videoDir, safeName);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error("视频不存在");
  }

  const metadata = await readMetadata(videoDir);
  metadata[safeName] = { ...(metadata[safeName] || {}), title: normalizedTitle, updatedAt: new Date().toISOString() };
  await writeMetadata(metadata, videoDir);

  const item = await getShortVideoItem(videoDir, getPublicBasePath(), metadata, safeName);
  if (!item) throw new Error("视频读取失败");
  return item;
}

export async function deleteShortVideo(fileName: string) {
  const safeName = safeShortVideoFileName(fileName);
  const videoDir = getShortVideoDirectory();
  const videoPath = path.join(videoDir, safeName);
  const fileStat = await stat(videoPath);
  if (!fileStat.isFile()) {
    throw new Error("视频不存在");
  }

  await unlink(videoPath);

  const baseName = path.basename(safeName, path.extname(safeName));
  await Promise.all(
    POSTER_EXTENSIONS.map(async (ext) => {
      try {
        await unlink(path.join(videoDir, `${baseName}${ext}`));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }),
  );

  const metadata = await readMetadata(videoDir);
  delete metadata[safeName];
  await writeMetadata(metadata, videoDir);
  return { deleted: true, fileName: safeName };
}
