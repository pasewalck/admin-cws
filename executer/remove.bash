#!/bin/bash
# /usr/local/lib/admin-cws/remove.bash
# Usage: sudo ./remove.bash <username>

set -euo pipefail

source /usr/local/lib/admin-cws/config.bash

die() {
    echo "[ERROR] $*" >&2
    exit 1
}

info() {
    echo "[INFO] $*"
}

warn() {
    echo "[WARNING] $*"
}

[[ $EUID -eq 0 ]] || die "Must be run as root."

[[ -n "${1:-}" ]] || die "Please provide a username as first argument."

USER_NAME="$1"

id "${USER_NAME}" &>/dev/null || die "User '${USER_NAME}' does not exist."

SCRIPTS_DIR="${SCRIPTS_BASE_DIR}/${USER_NAME}"
SUDOERS_FILE="/etc/sudoers.d/${USER_NAME}"

info "Removing sudoers file..."
if [[ -f "$SUDOERS_FILE" ]]; then
    rm -f "$SUDOERS_FILE"
    info "Removed ${SUDOERS_FILE}"
fi

info "Removing scripts directory..."
if [[ -d "$SCRIPTS_DIR" ]]; then
    rm -rf "$SCRIPTS_DIR"
    info "Removed ${SCRIPTS_DIR}"
fi

info "Removing user '${USER_NAME}'..."
userdel -r "${USER_NAME}" || die "Failed to remove user."

info "Removal Complete!"
