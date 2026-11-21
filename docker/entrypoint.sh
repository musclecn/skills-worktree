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

npm run db:setup

exec npm run start -- -p "${PORT:-3000}"
