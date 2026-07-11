#!/bin/bash
# /usr/local/lib/admin-cws/run.bash
set -euo pipefail

source /usr/local/lib/admin-cws/config.bash

USER_NAME="${USER:-admincwsbot}"
SCRIPT_DIR="${SCRIPTS_BASE_DIR}/${USER_NAME}/scripts"

log() {
    sudo -u root "$LOG_SCRIPT" "$1"
}

# ---------- helper: escape a string for JSON ----------
json_escape() {
    local s="$1"
    # escape backslash, double quote, and control characters
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    # escape newlines and tabs for JSON
    s="${s//$'\n'/\\n}"
    s="${s//$'\t'/\\t}"
    echo "$s"
}

run_command() {
    local cmd="$1"
    local args="$2"

    log "[$(date -Iseconds)] user $USER_NAME tried to run $cmd $args"

    SCRIPT_PATH="${SCRIPT_DIR}/${cmd}.bash.sudo"
    NEEDS_SUDO=true
    if [[ ! -f "$SCRIPT_PATH" ]]; then
        SCRIPT_PATH="${SCRIPT_DIR}/${cmd}.bash"
        NEEDS_SUDO=false
    fi

    if [[ ! -f "$SCRIPT_PATH" ]]; then
        local error_msg="Error: Unknown command '$cmd'"
        log "[$(date -Iseconds)] FAILURE: unknown command '$cmd'"
        echo "{"
        echo "  \"success\": false,"
        echo "  \"command\": \"$(json_escape "$cmd")\","
        echo "  \"args\": \"$(json_escape "$args")\","
        echo "  \"sudo\": $($NEEDS_SUDO && echo true || echo false),"
        echo "  \"error\": \"$(json_escape "$error_msg")\","
        echo "  \"output\": \"\""
        echo "}"
        exit 1
    fi

    # Execute command and capture output
    local output=""
    local exit_code=0

    if [[ "$NEEDS_SUDO" == true ]]; then
        output=$(sudo -u root "$SCRIPT_PATH" "$args" 2>&1) || exit_code=$?
    else
        output=$("$SCRIPT_PATH" "$args" 2>&1) || exit_code=$?
    fi

    # Return JSON with results
    echo "{"
    echo "  \"success\": $( [[ $exit_code -eq 0 ]] && echo true || echo false ),"
    echo "  \"command\": \"$(json_escape "$cmd")\","
    echo "  \"args\": \"$(json_escape "$args")\","
    echo "  \"sudo\": $($NEEDS_SUDO && echo true || echo false),"
    echo "  \"exit_code\": $exit_code,"
    echo "  \"output\": \"$(json_escape "$output")\""
    echo "}"

    log "[$(date -Iseconds)] command '$cmd' completed with exit code $exit_code"
    exit $exit_code
}

list_commands() {
    local script_dir="$SCRIPT_DIR"
    declare -A cmd_names

    # glob for script files
    shopt -s nullglob
    for f in "$script_dir"/*.bash "$script_dir"/*.bash.sudo; do
        local base=$(basename "$f")
        local cmd_name=""
        if [[ "$base" == *.bash.sudo ]]; then
            cmd_name="${base%.bash.sudo}"
        else
            cmd_name="${base%.bash}"
        fi
        cmd_names["$cmd_name"]=1
    done

    local first=true
    echo "["
    for cmd in "${!cmd_names[@]}"; do
        local sudo_file="$script_dir/$cmd.bash.sudo"
        local reg_file="$script_dir/$cmd.bash"
        local source_file=""
        local sudo_flag=false
        local desc=""

        if [[ -f "$sudo_file" ]]; then
            source_file="$sudo_file"
            sudo_flag=true
        elif [[ -f "$reg_file" ]]; then
            source_file="$reg_file"
        else
            continue
        fi

        if [[ -f "$source_file" ]]; then
            local second_line
            second_line=$(sed -n '2p' "$source_file")
            if [[ "$second_line" == \#* ]]; then
                desc="${second_line:1}"
                desc="${desc#"${desc%%[![:space:]]*}"}"
            fi
        fi

        if [[ "$first" == true ]]; then
            first=false
        else
            echo ","
        fi

        printf '  {"command": "%s", "sudo": %s, "description": "%s"}' \
            "$(json_escape "$cmd")" \
            "$($sudo_flag && echo true || echo false)" \
            "$(json_escape "$desc")"
    done
    echo ""
    echo "]"
}

TOP_CMD=$(echo "$SSH_ORIGINAL_COMMAND" | awk '{print $1}')
TOP_CMD_ARGS="${SSH_ORIGINAL_COMMAND#* }"

if [[ "$TOP_CMD" == "run" ]]; then
    CMD=$(echo "$TOP_CMD_ARGS" | awk '{print $1}')
    ARGS="${TOP_CMD_ARGS#* }"

    run_command "$CMD" "$ARGS"

elif [[ "$TOP_CMD" == "list" ]]; then
    list_commands
fi
