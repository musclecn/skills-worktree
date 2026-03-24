#!/bin/sh
set -e

npm run db:setup

exec npm run start -- -p "${PORT:-3000}"
