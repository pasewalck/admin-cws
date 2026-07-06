#!/bin/bash
# /usr/local/lib/admin-cws/run.bash
set -euo pipefail

source /usr/local/lib/admin-cws/config.bash

USER_NAME="${USER:-admincwsbot}"
SCRIPT_DIR="${SCRIPTS_BASE_DIR}/${USER_NAME}/scripts"

log() {
    sudo -u root "$LOG_SCRIPT" "$1"
}

# Parse command
CMD=$(echo "$SSH_ORIGINAL_COMMAND" | awk '{print $1}')
ARGS="${SSH_ORIGINAL_COMMAND#* }"

# Log the attempt
log "[$(date -Iseconds)] user $USER_NAME tried to run $CMD $ARGS"

# Determine script path (prefer .sudo version)
SCRIPT_PATH="${SCRIPT_DIR}/${CMD}.bash.sudo"
NEEDS_SUDO=true
if [[ ! -f "$SCRIPT_PATH" ]]; then
    SCRIPT_PATH="${SCRIPT_DIR}/${CMD}.bash"
    NEEDS_SUDO=false
fi

# Execute
if [[ ! -f "$SCRIPT_PATH" ]]; then
    echo "Error: Unknown command '$CMD'"
    log "[$(date -Iseconds)] FAILURE: unknown command '$CMD'"
    exit 1
fi

if [[ "$NEEDS_SUDO" == true ]]; then
    exec sudo -u root "$SCRIPT_PATH" "$ARGS"
else
    exec "$SCRIPT_PATH" "$ARGS"
fi