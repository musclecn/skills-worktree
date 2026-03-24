import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function createTempDatabaseUrl(prefix: string) {
  const dbFile = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  return `file:${dbFile}`;
}

export function databaseFileFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Invalid sqlite url: ${databaseUrl}`);
  }
  return databaseUrl.slice("file:".length).split("?")[0];
}

export function setupDatabase(databaseUrl: string) {
  execSync("npx tsx scripts/db-setup.ts", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}

export function cleanupDatabase(databaseUrl: string) {
  const file = databaseFileFromUrl(databaseUrl);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}
