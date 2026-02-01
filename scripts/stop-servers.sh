#!/bin/bash

# stop-servers.sh - Stop all running dev servers
# Usage: ./scripts/stop-servers.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info "Stopping dev servers..."

# Kill processes on port 3000 (backend)
if lsof -ti:3000 >/dev/null 2>&1; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    print_success "Stopped backend server (port 3000)"
else
    print_info "No backend server running on port 3000"
fi

# Kill processes on port 5173 (frontend Vite)
if lsof -ti:5173 >/dev/null 2>&1; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    print_success "Stopped frontend server (port 5173)"
else
    print_info "No frontend server running on port 5173"
fi

# Also kill any npm/node processes that might be running dev servers
pkill -f "vite" 2>/dev/null && print_success "Killed Vite processes" || true
pkill -f "tsx.*server" 2>/dev/null && print_success "Killed backend processes" || true

# Clean up PID files
rm -f /tmp/interview-prep-backend.pid /tmp/interview-prep-frontend.pid

print_success "All dev servers stopped"
