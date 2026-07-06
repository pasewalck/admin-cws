#!/bin/bash
# /usr/local/lib/admin-cws/log.bash
set -euo pipefail

source /usr/local/lib/admin-cws/config.bash

USER_NAME="${USER:-admincwsbot}"

mkdir -p "$LOG_DIR"
echo "[$(date -Iseconds)] ($USER_NAME) $1" >> "$LOG_FILE"