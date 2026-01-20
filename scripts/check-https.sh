#!/bin/bash
# HTTPS/Passkey Environment Checker
# Detects if passkey testing is attempted without HTTPS
# Usage: ./scripts/check-https.sh
#        source ./scripts/check-https.sh && check_passkey_ready

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Check if HTTPS proxy is running
check_https_proxy() {
    if curl -sk https://local.villa.cash/caddy-health 2>/dev/null | grep -q "OK"; then
        echo -e "${GREEN}✓${NC} HTTPS proxy running at local.villa.cash"
        return 0
    elif curl -sk https://localhost/caddy-health 2>/dev/null | grep -q "OK"; then
        echo -e "${GREEN}✓${NC} HTTPS proxy running at localhost"
        return 0
    else
        return 1
    fi
}

# Check if /etc/hosts is configured
check_hosts() {
    if grep -q "local.villa.cash" /etc/hosts 2>/dev/null; then
        echo -e "${GREEN}✓${NC} local.villa.cash in /etc/hosts"
        return 0
    else
        return 1
    fi
}

# Check if Docker is running for HTTPS proxy
check_docker() {
    if docker ps 2>/dev/null | grep -q "villa-https\|caddy"; then
        echo -e "${GREEN}✓${NC} HTTPS Docker container running"
        return 0
    else
        return 1
    fi
}

# Main check function - can be sourced and called
check_passkey_ready() {
    local errors=0
    
    echo -e "\n${BOLD}Passkey Environment Check${NC}"
    echo -e "────────────────────────────────────────"
    
    # Check hosts file
    if ! check_hosts; then
        echo -e "${YELLOW}!${NC} local.villa.cash not in /etc/hosts"
        echo -e "  ${BLUE}Fix:${NC} sudo ./scripts/setup-hosts.sh"
        errors=$((errors + 1))
    fi
    
    # Check Docker
    if ! check_docker; then
        echo -e "${YELLOW}!${NC} HTTPS proxy container not running"
        echo -e "  ${BLUE}Fix:${NC} bun dev:local"
        errors=$((errors + 1))
    fi
    
    # Check Docker
    if ! check_docker; then
        echo -e "${YELLOW}!${NC} HTTPS proxy container not running"
        echo -e "  ${BLUE}Fix:${NC} bun dev:local"
        errors=$((errors + 1))
    fi
    
    echo ""
    
    if [ $errors -gt 0 ]; then
        echo -e "${RED}${BOLD}Passkeys will NOT work in current environment!${NC}"
        echo ""
        echo -e "To enable passkey testing:"
        echo -e "  1. ${CYAN}sudo ./scripts/setup-hosts.sh${NC}  (one-time)"
        echo -e "  2. ${CYAN}bun dev:local${NC}                  (start dev)"
        echo ""
        return 1
    else
        echo -e "${GREEN}${BOLD}Passkey environment ready!${NC}"
        echo -e "Access at: ${GREEN}https://local.villa.cash${NC}"
        return 0
    fi
}

# Warn if passkey-related code changes detected without HTTPS
check_passkey_code_changes() {
    local changed_files=$(git diff --name-only HEAD~1 2>/dev/null || echo "")
    
    # Patterns that indicate passkey-related work
    local passkey_patterns="porto|webauthn|passkey|credential|authenticator"
    
    if echo "$changed_files" | grep -qiE "$passkey_patterns"; then
        echo -e "\n${YELLOW}${BOLD}WARNING: Passkey-related code detected!${NC}"
        echo -e "You're working on passkey code. Make sure you're testing with HTTPS."
        echo ""
        check_passkey_ready
        return $?
    fi
    
    return 0
}

# Block passkey testing without HTTPS (strict mode)
enforce_https_for_passkeys() {
    if ! check_passkey_ready > /dev/null 2>&1; then
        echo -e "\n${RED}${BOLD}ERROR: HTTPS required for passkey testing!${NC}"
        echo ""
        echo "Passkeys/WebAuthn require a secure context (HTTPS)."
        echo "The localhost exception does NOT work reliably."
        echo ""
        echo -e "Fix: Run ${CYAN}bun dev:local${NC} instead of ${CYAN}bun dev${NC}"
        echo ""
        return 1
    fi
    return 0
}

# Show full status
show_status() {
    echo -e "\n${BOLD}Villa HTTPS/Passkey Status${NC}"
    echo -e "════════════════════════════════════════"
    
    # Environment
    echo -e "\n${BOLD}Environment${NC}"
    check_hosts || true
    check_docker || true
    check_https_proxy || true
    
    # Dev server
    echo -e "\n${BOLD}Dev Server${NC}"
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Next.js running on localhost:3000"
    else
        echo -e "${YELLOW}!${NC} Next.js not running"
    fi
    
    # Porto SDK (if we can check)
    echo -e "\n${BOLD}Passkey Readiness${NC}"
    if check_https_proxy > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Ready for passkey testing"
    else
        echo -e "${RED}✗${NC} NOT ready for passkey testing"
    fi
    
    echo ""
}

# Main entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-status}" in
        status|--status|-s)
            show_status
            ;;
        check|--check|-c)
            check_passkey_ready
            ;;
        enforce|--enforce|-e)
            enforce_https_for_passkeys
            ;;
        changes|--changes)
            check_passkey_code_changes
            ;;
        help|--help|-h)
            echo "Villa HTTPS/Passkey Checker"
            echo ""
            echo "Usage: ./scripts/check-https.sh [command]"
            echo ""
            echo "Commands:"
            echo "  status   Show full status (default)"
            echo "  check    Check if passkey environment is ready"
            echo "  enforce  Block if HTTPS not available (strict)"
            echo "  changes  Warn if passkey code changed without HTTPS"
            echo "  help     Show this help"
            echo ""
            echo "For use in other scripts:"
            echo "  source ./scripts/check-https.sh"
            echo "  check_passkey_ready"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Run './scripts/check-https.sh help' for usage"
            exit 1
            ;;
    esac
fi
