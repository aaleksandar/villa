#!/bin/bash
# Villa Database SSH Tunnel
#
# Creates an SSH tunnel to access the private database from local development.
# Requires a bastion/jump host droplet in the same VPC.
#
# Usage:
#   ./scripts/db-tunnel.sh start    # Start tunnel in background
#   ./scripts/db-tunnel.sh stop     # Stop tunnel
#   ./scripts/db-tunnel.sh status   # Check tunnel status
#   ./scripts/db-tunnel.sh test     # Test connection through tunnel

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
BASTION_HOST="${VILLA_BASTION_HOST:-}"
BASTION_USER="${VILLA_BASTION_USER:-root}"
BASTION_KEY="${VILLA_BASTION_KEY:-~/.ssh/id_ed25519}"
LOCAL_PORT="${VILLA_DB_LOCAL_PORT:-5433}"
DB_HOST="private-villa-db-do-user-25748363-0.g.db.ondigitalocean.com"
DB_PORT="25060"
PID_FILE="/tmp/villa-db-tunnel.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo -e "${BLUE}Villa Database SSH Tunnel${NC}"
    echo ""
    echo "Usage: $0 {start|stop|status|test}"
    echo ""
    echo "Commands:"
    echo "  start   - Start SSH tunnel in background"
    echo "  stop    - Stop SSH tunnel"
    echo "  status  - Check if tunnel is running"
    echo "  test    - Test database connection through tunnel"
    echo ""
    echo "Environment Variables:"
    echo "  VILLA_BASTION_HOST  - Bastion/jump host IP or hostname (required)"
    echo "  VILLA_BASTION_USER  - SSH user (default: root)"
    echo "  VILLA_BASTION_KEY   - SSH key path (default: ~/.ssh/id_ed25519)"
    echo "  VILLA_DB_LOCAL_PORT - Local port to forward (default: 5433)"
    echo ""
    echo "Example:"
    echo "  export VILLA_BASTION_HOST=123.45.67.89"
    echo "  $0 start"
    echo "  psql postgresql://doadmin:pass@localhost:5433/defaultdb?sslmode=require"
}

check_bastion() {
    if [[ -z "$BASTION_HOST" ]]; then
        echo -e "${RED}Error: VILLA_BASTION_HOST not set${NC}"
        echo ""
        echo "You need a bastion host (droplet) in the same VPC as the database."
        echo "Create one with:"
        echo "  doctl compute droplet create villa-bastion \\"
        echo "    --size s-1vcpu-512mb-10gb \\"
        echo "    --image ubuntu-24-04-x64 \\"
        echo "    --region nyc1 \\"
        echo "    --vpc-uuid 0675fc93-b3bd-4ebe-a21c-d1e9632984ee \\"
        echo "    --ssh-keys \$(doctl compute ssh-key list --format ID --no-header | head -1)"
        exit 1
    fi
}

start_tunnel() {
    check_bastion

    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Tunnel already running (PID: $pid)${NC}"
            return 0
        fi
    fi

    echo -e "${BLUE}Starting SSH tunnel...${NC}"
    echo "  Local:  localhost:$LOCAL_PORT"
    echo "  Remote: $DB_HOST:$DB_PORT"
    echo "  Via:    $BASTION_USER@$BASTION_HOST"
    echo ""

    # Start SSH tunnel in background
    ssh -f -N -L "$LOCAL_PORT:$DB_HOST:$DB_PORT" \
        -i "$BASTION_KEY" \
        -o StrictHostKeyChecking=accept-new \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        "$BASTION_USER@$BASTION_HOST"

    # Find and save PID
    sleep 1
    local pid=$(pgrep -f "ssh.*$LOCAL_PORT:$DB_HOST" | head -1)
    if [[ -n "$pid" ]]; then
        echo "$pid" > "$PID_FILE"
        echo -e "${GREEN}Tunnel started (PID: $pid)${NC}"
        echo ""
        echo "Connect with:"
        echo "  DATABASE_URL=postgresql://doadmin:PASSWORD@localhost:$LOCAL_PORT/defaultdb?sslmode=require"
    else
        echo -e "${RED}Failed to start tunnel${NC}"
        exit 1
    fi
}

stop_tunnel() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${BLUE}Stopping tunnel (PID: $pid)...${NC}"
            kill "$pid"
            rm -f "$PID_FILE"
            echo -e "${GREEN}Tunnel stopped${NC}"
        else
            echo -e "${YELLOW}Tunnel not running (stale PID file)${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}No tunnel running${NC}"
    fi
}

status_tunnel() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}Tunnel running (PID: $pid)${NC}"
            echo "  Local port: $LOCAL_PORT"
            return 0
        fi
    fi
    echo -e "${YELLOW}Tunnel not running${NC}"
    return 1
}

test_connection() {
    echo -e "${BLUE}Testing connection through tunnel...${NC}"

    if ! status_tunnel >/dev/null 2>&1; then
        echo -e "${RED}Tunnel not running. Start it first with: $0 start${NC}"
        exit 1
    fi

    if command -v psql &>/dev/null; then
        echo "Testing with psql..."
        if psql "postgresql://doadmin@localhost:$LOCAL_PORT/defaultdb?sslmode=require" \
            -c "SELECT version();" 2>/dev/null; then
            echo -e "${GREEN}Connection successful!${NC}"
        else
            echo -e "${RED}Connection failed${NC}"
            echo "Check your password and SSL settings"
        fi
    elif command -v pg_isready &>/dev/null; then
        echo "Testing with pg_isready..."
        if pg_isready -h localhost -p "$LOCAL_PORT"; then
            echo -e "${GREEN}Database is accepting connections${NC}"
        else
            echo -e "${RED}Database not ready${NC}"
        fi
    else
        echo "Testing with nc..."
        if nc -z localhost "$LOCAL_PORT" 2>/dev/null; then
            echo -e "${GREEN}Port $LOCAL_PORT is open${NC}"
        else
            echo -e "${RED}Port $LOCAL_PORT is not accessible${NC}"
        fi
    fi
}

# Main
case "${1:-}" in
    start)
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    status)
        status_tunnel
        ;;
    test)
        test_connection
        ;;
    *)
        usage
        exit 1
        ;;
esac
