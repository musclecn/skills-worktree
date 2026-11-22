#!/bin/sh
set -e

DB_FILE="${DB_FILE:-/app/data/sztaxs.db}"
DB_BACKUP_DIR="${DB_BACKUP_DIR:-/app/db-backups}"
DB_BACKUP_TZ="${DB_BACKUP_TZ:-Asia/Shanghai}"

if [ -f "$DB_FILE" ]; then
  mkdir -p "$DB_BACKUP_DIR"
  BACKUP_FILE="$DB_BACKUP_DIR/$(TZ="$DB_BACKUP_TZ" date +%Y%m%d%H%M%S)-sztaxs.db"
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "Backed up database to $BACKUP_FILE"
else
  echo "Database file $DB_FILE does not exist yet, skipping backup"
fi

# 已有数据库时只补表结构，不跑 seed：seed 会用代码里的基准内容覆盖后台改过的正式内容。
# 只有全新部署（数据库文件不存在）才执行完整初始化；确需重跑 seed 时设 SEED_ON_START=1。
if [ -f "$DB_FILE" ] && [ "${SEED_ON_START:-0}" != "1" ]; then
  npx tsx scripts/db-setup.ts --schema-only
else
  npm run db:setup
fi

exec npm run start -- -p "${PORT:-3000}"
