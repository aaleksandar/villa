#!/bin/bash
# Villa Local Development - HYBRID MODE
#
# Default: Native Next.js + Docker HTTPS proxy (recommended for passkeys)
# Fallback: Native Next.js only (HTTP, no passkeys)
#
# Usage:
#   bun dev:local        # Hybrid mode (passkeys work)
#   bun dev              # Native only (fast, no passkeys)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

MODE="${1:---local}"

# ─────────────────────────────────────────
# Prerequisites Check
# ─────────────────────────────────────────

check_prereqs() {
    local errors=0

    # Node
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        errors=$((errors + 1))
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            echo -e "${RED}✗ Node.js 20+ required (found $(node -v))${NC}"
            errors=$((errors + 1))
        fi
    fi

    # bun
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}✗ bun not found. Run: curl -fsSL https://bun.sh/install | bash${NC}"
        errors=$((errors + 1))
    fi

    return $errors
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        return 1
    fi
    if ! docker info &> /dev/null 2>&1; then
        return 1
    fi
    return 0
}

get_lan_ip() {
    if command -v ipconfig &> /dev/null; then
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null
    elif command -v ip &> /dev/null; then
        ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}'
    fi
}

show_mobile_qr() {
    local IP=$(get_lan_ip)
    if [ -n "$IP" ]; then
        echo ""
        echo -e "${CYAN}📱 Mobile Testing:${NC}"
        echo -e "   URL: ${GREEN}https://$IP${NC}"
        echo ""
        if command -v npx &> /dev/null; then
            npx --yes qrcode-terminal "https://$IP" --small 2>/dev/null || true
        fi
        echo ""
        echo -e "${YELLOW}⚠️  Accept the self-signed certificate on mobile${NC}"
        echo ""
    fi
}

# ─────────────────────────────────────────
# HYBRID MODE: Native Next.js + Docker HTTPS
# ─────────────────────────────────────────

start_hybrid() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Villa Local Dev ${CYAN}(Hybrid Mode)${BLUE}        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    # Check prerequisites
    if ! check_prereqs; then
        exit 1
    fi

    if ! check_docker; then
        echo -e "${YELLOW}Docker not available - falling back to native mode${NC}"
        echo -e "${YELLOW}Passkeys will NOT work without HTTPS${NC}"
        echo ""
        start_native
        return
    fi

    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
    echo -e "${GREEN}✓${NC} bun $(bun -v)"
    echo -e "${GREEN}✓${NC} Docker ready"

    # Check /etc/hosts
    if grep -q "local.villa.cash" /etc/hosts 2>/dev/null; then
        echo -e "${GREEN}✓${NC} local.villa.cash configured"
        DEV_URL="https://local.villa.cash"
    else
        echo -e "${YELLOW}!${NC} Using localhost (run ${CYAN}sudo ./scripts/setup-hosts.sh${NC} for local.villa.cash)"
        DEV_URL="https://localhost"
    fi
    echo ""

    # Install deps if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        bun install
        echo ""
    fi

    # Start HTTPS proxy
    echo -e "${YELLOW}Starting HTTPS proxy...${NC}"
    docker-compose -f docker-compose.local.yml down 2>/dev/null || true
    docker-compose -f docker-compose.local.yml up -d

    # Wait for healthy
    echo -n "Waiting for HTTPS"
    for i in {1..20}; do
        if curl -sk "$DEV_URL/caddy-health" 2>/dev/null | grep -q "OK"; then
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo -e "${GREEN}✓${NC} HTTPS proxy ready"
    echo ""

    echo -e "App: ${GREEN}$DEV_URL${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"

    show_mobile_qr

    # Cleanup on exit
    trap 'echo ""; echo -e "${YELLOW}Stopping...${NC}"; docker-compose -f docker-compose.local.yml down 2>/dev/null; exit' INT TERM

    # Start Next.js
    cd apps/hub
    bun dev
}

# ─────────────────────────────────────────
# NATIVE MODE: Just Next.js
# ─────────────────────────────────────────

start_native() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Villa Local Dev ${YELLOW}(Native Mode)${BLUE}        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    if ! check_prereqs; then
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
    echo -e "${GREEN}✓${NC} bun $(bun -v)"
    echo ""

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        bun install
        echo ""
    fi

    echo -e "App: ${GREEN}http://localhost:3000${NC}"
    echo -e "${YELLOW}Note: Passkeys require HTTPS. Use 'bun dev:local' for passkey testing${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo ""

    cd apps/hub
    bun dev
}

# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

case "$MODE" in
    --local|-l)
        start_hybrid
        ;;
    --native|-n)
        start_native
        ;;
    --help|-h)
        echo "Villa Local Development"
        echo ""
        echo "Usage: ./scripts/dev.sh [mode]"
        echo ""
        echo "Modes:"
        echo "  --local, -l   Hybrid: Native Next.js + Docker HTTPS (default)"
        echo "                Passkeys work, fast HMR, recommended"
        echo ""
        echo "  --native, -n  Native only: Just Next.js on HTTP"
        echo "                Fastest startup, no passkey support"
        echo ""
        echo "Setup:"
        echo "  sudo ./scripts/setup-hosts.sh   Add local.villa.cash to /etc/hosts"
        ;;
    *)
        start_hybrid
        ;;
esac
