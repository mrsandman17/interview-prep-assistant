# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeetCode Daily Selector - an Anki-style spaced repetition app for LeetCode interview prep. Local deployment, single user.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3 or sqlite3)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Vite for frontend, ts-node or tsx for backend
- **Structure**: Monorepo with `/client` and `/server` folders

## Commands

*Note: Project not yet initialized. These are the expected commands based on PLAN.md:*

```bash
# Backend (from /server)
npm install
npm run dev          # Run development server

# Frontend (from /client)
npm install
npm run dev          # Run Vite dev server
npm run build        # Production build

# Root workspace
npm install          # Install all dependencies

# Testing
npm test             # Run all tests
npm test -- <file>   # Run specific test file
```

## Git Workflow

**REQUIRED: Always use git worktree for each Claude session**

Before starting any work, create a new worktree in a separate directory:

```bash
# Create a new branch and worktree for this session
git worktree add ../interview-prep-assistant-feature-name -b feature/descriptive-name

# Navigate to the new worktree
cd ../interview-prep-assistant-feature-name

# When done, remove the worktree
git worktree remove ../interview-prep-assistant-feature-name
```

**Why worktrees?**
- Isolates each Claude session in its own branch
- Prevents conflicts with main branch or other work
- Allows parallel work without stashing or switching branches
- Keeps the main repository clean

**Workflow:**
1. Start session: Create new worktree with descriptive branch name
2. Work in isolated directory
3. Commit changes regularly
4. **Before opening PR:**
   - Run all tests and ensure they pass: `npm test`
   - Run code reviewer agent to review changes (single review at PR time)
   - Fix any issues identified
5. Push branch and create PR when ready
6. **After PR is merged in GitHub:**
   - Delete the remote branch: `git push origin --delete feature/branch-name`
   - Navigate back to main repo: `cd ../interview-prep-assistant`
   - Remove the worktree: `git worktree remove ../interview-prep-assistant-feature-name`
   - Delete the local branch: `git branch -d feature/branch-name`

## Development Workflow

**Test-Driven Development (Streamlined)**

Write tests alongside implementation in quick iterations:
1. **Write test + implementation together** - Develop tests and code in parallel
2. **Run tests frequently** - Verify all tests pass at feature completion
3. **Refactor as needed** - Improve code while keeping tests green

Never implement features or fix bugs without corresponding tests.

**Parallelization**: Build multiple independent modules/endpoints simultaneously when possible to maximize efficiency.

## Architecture

### Backend Structure (`/server`)
- `/src/routes/` - Express route handlers (problems.ts, daily.ts, stats.ts, settings.ts)
- `/src/db/` - SQLite database setup and schema
- `/src/services/` - Business logic (selection.ts for spaced repetition algorithm, csv-parser.ts)

### Frontend Structure (`/client`)
- `/src/pages/` - Main views: Dashboard (daily practice), AllProblems (table view), Stats (progress)
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks for data fetching
- `/src/api/` - API client

### Core Domain Logic

**Spaced Repetition Algorithm** (`/server/src/services/selection.ts`):
- Problems have colors: gray (new) → orange → yellow → green (mastered)
- Eligibility thresholds: gray=always, orange=3+ days, yellow=7+ days, green=14+ days
- Daily selection ratio: 50% new, 40% review (orange/yellow), 10% mastered (green)
- User configures 3-5 problems per day

**Database Tables**: problems, attempts, daily_selections, settings

### API Endpoints
- `GET/POST /api/problems` - CRUD for problems
- `GET /api/daily` - Today's selection (creates if needed)
- `POST /api/daily/:problemId/complete` - Mark complete with color result
- `GET /api/stats` - Dashboard statistics
- `GET/PATCH /api/settings` - User preferences