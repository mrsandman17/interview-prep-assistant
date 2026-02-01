#!/bin/bash

# switch-branch.sh - Switch between worktree branches and manage dev servers
# Usage: ./scripts/switch-branch.sh <branch-name>
# Example: ./scripts/switch-branch.sh bugfix/delete-modal-error

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to kill dev servers
kill_servers() {
    print_info "Stopping any running dev servers..."

    # Kill processes on port 3000 (backend)
    if lsof -ti:3000 >/dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        print_success "Stopped backend server (port 3000)"
    fi

    # Kill processes on port 5173 (frontend Vite)
    if lsof -ti:5173 >/dev/null 2>&1; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        print_success "Stopped frontend server (port 5173)"
    fi

    # Also kill any npm/node processes that might be running dev servers
    pkill -f "vite" 2>/dev/null || true
    pkill -f "tsx.*server" 2>/dev/null || true

    sleep 1
}

# Function to list available worktrees
list_worktrees() {
    print_info "Available worktrees:"
    git worktree list | while IFS= read -r line; do
        # Extract branch name from worktree list output
        branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')
        path=$(echo "$line" | awk '{print $1}')
        if [ -n "$branch" ]; then
            echo "  • $branch → $path"
        fi
    done
}

# Function to find worktree path for a branch
find_worktree() {
    local branch=$1
    git worktree list | grep "\[$branch\]" | awk '{print $1}'
}

# Main script
main() {
    cd "$MAIN_REPO"

    # Check if branch name provided
    if [ -z "$1" ]; then
        print_error "No branch name provided"
        echo ""
        list_worktrees
        echo ""
        echo "Usage: $0 <branch-name>"
        echo "Example: $0 bugfix/delete-modal-error"
        exit 1
    fi

    BRANCH=$1

    # Find the worktree for this branch
    WORKTREE_PATH=$(find_worktree "$BRANCH")

    if [ -z "$WORKTREE_PATH" ]; then
        print_error "No worktree found for branch '$BRANCH'"
        echo ""
        list_worktrees
        exit 1
    fi

    print_success "Found worktree for '$BRANCH' at: $WORKTREE_PATH"

    # Kill existing servers
    kill_servers

    # Navigate to worktree
    cd "$WORKTREE_PATH"
    print_success "Switched to: $WORKTREE_PATH"

    # Check if node_modules exist
    if [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
        print_warning "Dependencies not installed. Installing..."
        cd server && npm install && cd ..
        cd client && npm install && cd ..
    fi

    print_info "Starting dev servers..."
    echo ""
    print_info "Backend will run on: http://localhost:3000"
    print_info "Frontend will run on: http://localhost:5173"
    echo ""
    print_warning "Press Ctrl+C to stop both servers"
    echo ""

    # Sanitize branch name for log files (replace / with -)
    SAFE_BRANCH=$(echo "$BRANCH" | tr '/' '-')

    # Start backend in background
    cd "$WORKTREE_PATH/server"
    npm run dev > /tmp/backend-$SAFE_BRANCH.log 2>&1 &
    BACKEND_PID=$!

    # Start frontend in background
    cd "$WORKTREE_PATH/client"
    npm run dev > /tmp/frontend-$SAFE_BRANCH.log 2>&1 &
    FRONTEND_PID=$!

    # Save PIDs for cleanup
    echo "$BACKEND_PID" > /tmp/interview-prep-backend.pid
    echo "$FRONTEND_PID" > /tmp/interview-prep-frontend.pid

    sleep 3

    # Check if servers started successfully
    if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
        print_success "Servers started successfully!"
        echo ""
        print_info "Backend log: /tmp/backend-$SAFE_BRANCH.log"
        print_info "Frontend log: /tmp/frontend-$SAFE_BRANCH.log"
        echo ""
        print_info "To view logs in real-time:"
        echo "  Backend:  tail -f /tmp/backend-$SAFE_BRANCH.log"
        echo "  Frontend: tail -f /tmp/frontend-$SAFE_BRANCH.log"
        echo ""

        # Trap Ctrl+C to kill servers
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_info 'Servers stopped'; exit 0" INT TERM

        # Wait for user to stop
        wait
    else
        print_error "Failed to start servers"
        print_info "Check logs:"
        echo "  Backend:  tail /tmp/backend-$SAFE_BRANCH.log"
        echo "  Frontend: tail /tmp/frontend-$SAFE_BRANCH.log"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
}

main "$@"
