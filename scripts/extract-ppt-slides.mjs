import { execFileSync } from "node:child_process";
import http from "node:http";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const previewIndexRoot = path.join(repoRoot, "public", "ppt-previews");
const outputRoot = path.join(repoRoot, "public", "ppt-slides");

const DECK_SOURCES = {
  "ppt2025": "/Users/musclecn/Documents/work/TAX/泰可思数科公司财税服务产品及能力介绍（2025详细版05）.pptx",
  "ppt-overseas": "/Users/musclecn/Desktop/越南电子发票解决方案-20260306(1)(2).pptx",
};

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function getSelectedSlideIndexes(deckName) {
  return readdirSync(path.join(previewIndexRoot, deckName))
    .filter((filename) => filename.endsWith(".html"))
    .sort((left, right) => left.localeCompare(right))
    .map((filename) => ({
      filename,
      slideNumber: Number.parseInt(filename.match(/slide-(\d+)\.html$/)?.[1] ?? "", 10),
    }));
}

function renderQuickLookPreview(pptPath, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  execFileSync("qlmanage", ["-p", "-o", outputDir, pptPath], { stdio: "ignore" });
  const previewDir = readdirSync(outputDir)
    .filter((name) => name.endsWith(".qlpreview"))
    .map((name) => path.join(outputDir, name))[0];

  if (!previewDir) {
    throw new Error(`Quick Look preview was not generated for ${pptPath}`);
  }

  return previewDir;
}

function buildDeckPreviewDir(deckName, pptPath, tempRoot) {
  const qlRoot = path.join(tempRoot, `${deckName}-ql`);
  const qlPreviewDir = renderQuickLookPreview(pptPath, qlRoot);
  const tempDeckDir = path.join(tempRoot, deckName);
  mkdirSync(tempDeckDir, { recursive: true });

  const previewHtmlPath = path.join(qlPreviewDir, "Preview.html");
  let previewHtml = readFileSync(previewHtmlPath, "utf8");
  const pdfSources = [...new Set([...previewHtml.matchAll(/src="([^"]+\.pdf)"/gi)].map((match) => match[1]))];

  for (const assetName of readdirSync(qlPreviewDir)) {
    if (assetName === "Preview.html") continue;
    copyFileSync(path.join(qlPreviewDir, assetName), path.join(tempDeckDir, assetName));
  }

  for (const pdfSource of pdfSources) {
    const pdfPath = path.join(tempDeckDir, pdfSource);
    const pngName = `${path.basename(pdfSource, ".pdf")}-pdf.png`;
    const pngPath = path.join(tempDeckDir, pngName);
    execFileSync("sips", ["-s", "format", "png", pdfPath, "--out", pngPath], { stdio: "ignore" });
    previewHtml = previewHtml.replaceAll(`src="${pdfSource}"`, `src="${pngName}"`);
  }

  writeFileSync(path.join(tempDeckDir, "Preview.html"), previewHtml);
  return tempDeckDir;
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname.replace(/^\/+/, "");
      const filePath = path.normalize(path.join(rootDir, relativePath));

      if (!filePath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404);
        response.end("Not Found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(filePath).pipe(response);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to start local preview server.");
      }
      resolve({ server, port: address.port });
    });
  });
}

async function renderDeckSlides(deckName, port, page) {
  const outputDeckDir = path.join(outputRoot, deckName);
  mkdirSync(outputDeckDir, { recursive: true });

  await page.goto(`http://127.0.0.1:${port}/${deckName}/Preview.html`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  const slides = page.locator(".slide");
  const count = await slides.count();

  for (const { filename, slideNumber } of getSelectedSlideIndexes(deckName)) {
    if (!slideNumber || slideNumber > count) {
      throw new Error(`Slide ${filename} was not found in ${deckName}.`);
    }

    const outputPath = path.join(outputDeckDir, filename.replace(/\.html$/i, ".png"));
    console.log(`Rendering ${deckName}/${path.basename(outputPath)}`);
    await slides.nth(slideNumber - 1).screenshot({ path: outputPath });
  }
}

async function main() {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "ppt-slide-render-"));
  rmSync(outputRoot, { recursive: true, force: true });

  for (const [deckName, pptPath] of Object.entries(DECK_SOURCES)) {
    buildDeckPreviewDir(deckName, pptPath, tempRoot);
  }

  let server;
  let browser;

  try {
    const serverState = await startStaticServer(tempRoot);
    server = serverState.server;
    try {
      browser = await webkit.launch({ headless: true });
      console.log("Using WebKit renderer for Quick Look slide capture");
    } catch (error) {
      console.warn(
        `WebKit launch failed, falling back to Chrome: ${error instanceof Error ? error.message : String(error)}`,
      );
      browser = await chromium.launch({ channel: "chrome", headless: true });
    }
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });

    for (const deckName of Object.keys(DECK_SOURCES)) {
      await renderDeckSlides(deckName, serverState.port, page);
    }

    await page.close();
    console.log(`Rendered PPT slide images to ${path.relative(repoRoot, outputRoot)}`);
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
