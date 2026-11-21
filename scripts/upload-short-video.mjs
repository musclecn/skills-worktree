#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, copyFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm"]);
const DEFAULT_HOST = "101.133.162.202";
const DEFAULT_USER = "root";
const DEFAULT_REMOTE_DIR = "/data/sztaxs-web-media/short-videos";
const DEFAULT_PASSWORD_FILE = path.join(os.homedir(), "Desktop", "keys1.txt");

function printHelp() {
  console.log(`Upload short videos to the production website.

Usage:
  npm run upload:short-video -- <video-file-or-directory...>
  npm run upload:short-video -- --latest <directory>
  npm run upload:short-video -- --title "Formal public title" <video-file>

Options:
  --latest <directory>        Upload only the newest video in a directory
  --host <host>               SSH host, default ${DEFAULT_HOST}
  --user <user>               SSH user, default ${DEFAULT_USER}
  --remote-dir <path>         Remote video directory, default ${DEFAULT_REMOTE_DIR}
  --password-file <path>      Password file, default ~/Desktop/keys1.txt
  --title <title>             Public display title; used as the uploaded file name
  --dry-run                   Print selected files without uploading
  -h, --help                  Show this help

Environment:
  SZTAXS_SSH_PASSWORD         SSH password. If unset, the script tries --password-file.
`);
}

function parseArgs(argv) {
  const options = {
    host: process.env.SZTAXS_SSH_HOST || DEFAULT_HOST,
    user: process.env.SZTAXS_SSH_USER || DEFAULT_USER,
    remoteDir: process.env.SZTAXS_SHORT_VIDEO_DIR || DEFAULT_REMOTE_DIR,
    passwordFile: process.env.SZTAXS_PASSWORD_FILE || DEFAULT_PASSWORD_FILE,
    latestDir: "",
    title: "",
    dryRun: false,
    inputs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--latest") {
      options.latestDir = argv[++index] || "";
    } else if (arg === "--host") {
      options.host = argv[++index] || options.host;
    } else if (arg === "--user") {
      options.user = argv[++index] || options.user;
    } else if (arg === "--remote-dir") {
      options.remoteDir = argv[++index] || options.remoteDir;
    } else if (arg === "--password-file") {
      options.passwordFile = argv[++index] || options.passwordFile;
    } else if (arg === "--title") {
      options.title = argv[++index] || "";
    } else {
      options.inputs.push(arg);
    }
  }

  return options;
}

function isVideoFile(filePath) {
  const base = path.basename(filePath);
  return !base.startsWith(".") && VIDEO_EXTENSIONS.has(path.extname(base).toLowerCase());
}

async function collectVideos(inputPath) {
  const resolved = path.resolve(inputPath);
  if (!existsSync(resolved)) {
    throw new Error(`Input does not exist: ${inputPath}`);
  }

  const fileStat = statSync(resolved);
  if (fileStat.isFile()) {
    return isVideoFile(resolved) ? [resolved] : [];
  }

  if (!fileStat.isDirectory()) {
    return [];
  }

  const results = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const child = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else if (entry.isFile() && isVideoFile(child)) {
        results.push(child);
      }
    }
  }
  await walk(resolved);
  return results;
}

function dedupeByPath(files) {
  return [...new Map(files.map((file) => [path.resolve(file), path.resolve(file)])).values()];
}

function normalizePublicTitle(rawTitle) {
  const title = String(rawTitle || "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "");
  if (!title) throw new Error("--title must contain a valid public display title.");
  if (title.length > 100) throw new Error("--title must be 100 characters or fewer.");
  return title;
}

function pickNewest(files) {
  return files
    .map((file) => ({ file, mtime: statSync(file).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0]?.file;
}

function readPassword(passwordFile) {
  if (process.env.SZTAXS_SSH_PASSWORD) {
    return process.env.SZTAXS_SSH_PASSWORD;
  }

  if (!existsSync(passwordFile)) {
    return "";
  }

  const text = readFileSync(passwordFile, "utf8");
  return text.match(/密码\s*[:：]?\s*([^\s，,]+)/)?.[1] || text.match(/Tax[^\s，,]+/)?.[0] || "";
}

function runCommand(command, args, { password = "", timeout = 0 } = {}) {
  if (!password) {
    const result = spawnSync(command, args, { stdio: "inherit", timeout });
    if (result.status !== 0) {
      throw new Error(`${command} failed with exit code ${result.status}`);
    }
    return;
  }

  const expectScript = `
set timeout -1
set pass $env(SZTAXS_EXPECT_PASSWORD)
spawn {*}[lrange $argv 0 end]
expect {
  -re {yes/no|fingerprint} { send "yes\\r"; exp_continue }
  -re {assword:} { send "$pass\\r"; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
`;
  const result = spawnSync("/usr/bin/expect", ["-f", "/dev/stdin", "--", command, ...args], {
    stdio: ["pipe", "inherit", "inherit"],
    env: { ...process.env, SZTAXS_EXPECT_PASSWORD: password },
    input: expectScript,
    timeout,
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function stageFiles(files, publicTitle = "") {
  const stageDir = mkdtempSync(path.join(os.tmpdir(), "sztaxs-short-video-stage-"));
  const usedNames = new Set();

  if (publicTitle && files.length !== 1) {
    throw new Error("--title requires exactly one selected video file.");
  }

  for (const file of files) {
    const parsed = path.parse(file);
    let targetName = publicTitle ? `${normalizePublicTitle(publicTitle)}${parsed.ext.toLowerCase()}` : parsed.base;
    let counter = 2;
    while (usedNames.has(targetName)) {
      targetName = `${parsed.name}-${counter}${parsed.ext}`;
      counter += 1;
    }
    usedNames.add(targetName);
    copyFileSync(file, path.join(stageDir, targetName));
  }

  const archivePath = path.join(os.tmpdir(), `sztaxs-short-videos-${Date.now()}.tar.gz`);
  const tarResult = spawnSync("tar", ["-czf", archivePath, "-C", stageDir, "."], {
    stdio: "inherit",
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  rmSync(stageDir, { recursive: true, force: true });

  if (tarResult.status !== 0) {
    throw new Error(`tar failed with exit code ${tarResult.status}`);
  }

  return archivePath;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  let files = [];
  if (options.latestDir) {
    const candidates = await collectVideos(options.latestDir);
    const newest = pickNewest(candidates);
    files = newest ? [newest] : [];
  } else {
    for (const input of options.inputs) {
      files.push(...(await collectVideos(input)));
    }
    files = dedupeByPath(files);
  }

  if (files.length === 0) {
    throw new Error("No video files found. Supported extensions: mp4, mov, m4v, webm.");
  }

  console.log(`Selected ${files.length} video file(s):`);
  for (const file of files) {
    const sizeMb = (statSync(file).size / 1024 / 1024).toFixed(1);
    console.log(`- ${file} (${sizeMb}MB)`);
  }
  if (options.title) {
    console.log(`Public title: ${normalizePublicTitle(options.title)}`);
  }

  if (options.dryRun) {
    console.log("Dry run only. Nothing uploaded.");
    return;
  }

  const password = readPassword(options.passwordFile);
  const archivePath = stageFiles(files, options.title);
  const remoteArchive = `/tmp/${path.basename(archivePath)}`;
  const target = `${options.user}@${options.host}:${remoteArchive}`;
  const sshBaseArgs = ["-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null"];

  try {
    console.log(`Uploading archive to ${target} ...`);
    runCommand("scp", [...sshBaseArgs, archivePath, target], { password });

    const remoteCommand = [
      "set -e",
      `mkdir -p ${shellQuote(options.remoteDir)}`,
      `tar -xzf ${shellQuote(remoteArchive)} -C ${shellQuote(options.remoteDir)}`,
      `find ${shellQuote(options.remoteDir)} -maxdepth 1 -type f -name '._*' -delete`,
      `chmod -R a+rX ${shellQuote(options.remoteDir)}`,
      `rm -f ${shellQuote(remoteArchive)}`,
      `docker restart sztaxs-web >/dev/null`,
      `printf 'container_status='`,
      `docker inspect -f '{{.State.Status}}' sztaxs-web`,
      `printf 'remote_video_count='`,
      `find ${shellQuote(options.remoteDir)} -maxdepth 1 -type f \\( -name '*.mp4' -o -name '*.mov' -o -name '*.m4v' -o -name '*.webm' \\) | wc -l`,
    ].join("; ");

    console.log(`Extracting to ${options.remoteDir} ...`);
    runCommand("ssh", [...sshBaseArgs, `${options.user}@${options.host}`, remoteCommand], { password });
    console.log(`Done. Open: https://www1.sztaxs.com/short-videos`);
  } finally {
    rmSync(archivePath, { force: true });
  }
}

main().catch((error) => {
  console.error(`upload-short-video failed: ${error.message}`);
  process.exit(1);
});
