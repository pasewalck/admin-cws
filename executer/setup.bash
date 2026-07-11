#!/bin/bash
# /usr/local/lib/admin-cws/setup.bash
# Usage: sudo ./setup.bash <username> <public-key-or-path>
set -euo pipefail

if [[ ! -f /usr/local/lib/admin-cws/config.bash ]]; then
    echo ""
    echo "admin-cws is not installed. This script will install it now."
    echo "The following files will be placed in /usr/local/lib/admin-cws/:"
    echo "  - config.bash"
    echo "  - run.bash"
    echo "  - log.bash"
    echo "  - setup.bash"
    echo "  - remove.bash"
    echo ""
    read -r -p "Proceed with installation? [y/N] " REPLY
    case "$REPLY" in
        [yY]|[yY][eE][sS]) ;;
        *) echo "Aborted."; exit 1 ;;
    esac

    TEMP_DIR=$(mktemp -d)
    git clone --depth 1 https://github.com/pasewalck/admin-cws.git "$TEMP_DIR" 2>/dev/null || {
        echo "[ERROR] Failed to clone admin-cws repository. Ensure git is installed and you have internet access." >&2
        exit 1
    }

    (cd "$TEMP_DIR/executer" && make install) || {
        echo "[ERROR] Failed to install admin-cws via Makefile." >&2
        exit 1
    }

    rm -rf "$TEMP_DIR"
    exec /usr/local/lib/admin-cws/setup.bash "$@"
fi

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

[[ -n "${1:-}" ]] || die "Please provide an username as first argument."
[[ -n "${2:-}" ]] || die "Please provide a public key file as second argument."

USER_NAME="$1"
KEY_INPUT="$2"

if [[ -f "$KEY_INPUT" ]]; then
    PUBKEY=$(cat "$KEY_INPUT")
else
    PUBKEY="$KEY_INPUT"
fi

if id "${USER_NAME}" &>/dev/null; then
    die "User '${USER_NAME}' already exists."
fi

USER_HOME="/home/${USER_NAME}"
SCRIPTS_DIR="${SCRIPTS_BASE_DIR}/${USER_NAME}/scripts"
SSH_DIR="${USER_HOME}/.ssh"

for cmd in useradd passwd chmod chown mkdir cat tee systemctl; do
    command -v "$cmd" &>/dev/null || die "Required command '$cmd' not found"
done

info "Creating user '${USER_NAME}' with restricted shell..."

useradd -m -s /bin/bash "${USER_NAME}" || die "Failed to create user."
passwd -l "${USER_NAME}"
info "User created and password locked."

info "Setting up SSH authorized_keys..."

mkdir -p "${SSH_DIR}"
chmod 700 "${SSH_DIR}"

printf 'command="%s",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding %s\n' "${RUN_SCRIPT}" "${PUBKEY}" > "${SSH_DIR}/authorized_keys"

chmod 600 "${SSH_DIR}/authorized_keys"
chown -R "${USER_NAME}:${USER_NAME}" "${SSH_DIR}"

# ================ Set up sudoers ================
info "Setting up sudoers..."

# Create sudoers entry
# Allow ALL .sudo scripts to run as root without password
SUDOERS_FILE="/etc/sudoers.d/$USER_NAME"
echo "# Allow ${USER_NAME} to run its own .sudo scripts" >> "$SUDOERS_FILE"
echo "${USER_NAME} ALL=(ALL) !ALL" >> "$SUDOERS_FILE"
echo "${USER_NAME} ALL=(root) NOPASSWD: ${SCRIPTS_DIR}/*.sudo" >> "$SUDOERS_FILE"
echo "${USER_NAME} ALL=(root) NOPASSWD: ${LOG_SCRIPT}" >> "$SUDOERS_FILE"

chmod 440 "$SUDOERS_FILE"

# Verify sudoers syntax
if ! visudo -c -f "$SUDOERS_FILE"; then
    warn "Invalid sudoers configuration. Please investigate!"
fi

# ================ Create scripts directory ================
info "Creating scripts directory..."
mkdir -p "${SCRIPTS_DIR}"
chmod 755 "${SCRIPTS_DIR}"

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "  User:         ${USER_NAME}"
echo "  Scripts:      ${SCRIPTS_DIR}"
echo ""
echo "  To add a new command:"
echo "    1. Create script in ${SCRIPTS_DIR}"
echo "    2. Name it command-name.bash (no sudo) or command-name.bash.sudo (with sudo)"
echo "    3. Make executable: chmod 755"
echo ""
echo "  To test via SSH:"
echo "    ssh ${USER_NAME}@$(hostname -I | awk '{print $1}') command-name"
echo ""