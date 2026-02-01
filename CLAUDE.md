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

## Security & Secret Protection

**CRITICAL: Never commit secrets to the repository**

This project uses automated secret scanning to prevent accidental exposure of sensitive data.

### Secret Protection Layers

1. **.gitignore**: Blocks common secret files (`.env`, `*.db`, credentials)
2. **Pre-commit Hook**: Scans staged files for secrets before each commit (gitleaks)
3. **Manual Scanning**: Run `npm run scan:history` to scan entire git history

### What Are Secrets?

**NEVER commit:**
- API keys, tokens, passwords
- Environment files (`.env`, `.env.local`)
- Database files (`*.db`, `*.sqlite`)
- Private keys (`*.pem`, `*.key`, `id_rsa`)
- Credentials files (`secrets.json`, `credentials.json`)

**Safe to commit:**
- `.env.example` (template with placeholder values)
- Test fixtures with mock data
- Public configuration (e.g., port numbers, feature flags)

### Using Environment Variables

```bash
# Server-side (.env file in /server, NEVER commit)
PORT=3000
NODE_ENV=development

# Access in code
const port = process.env.PORT || 3000;
```

**Best practices:**
1. Create `.env.example` with placeholder values
2. Add `.env` to `.gitignore` (already done)
3. Document required variables in README
4. Never hardcode secrets in source code

### Pre-commit Hook Workflow

**Normal workflow** (no secrets detected):
```bash
git add src/feature.ts
git commit -m "Add feature"
# 🔍 Scanning for secrets with gitleaks...
# ✅ No secrets detected. Proceeding with commit.
```

**Blocked commit** (secret detected):
```bash
git add .env  # Accidentally staged secret file
git commit -m "Update config"
# 🔍 Scanning for secrets with gitleaks...
# ❌ SECRET DETECTED! Commit blocked.
#
# 🛠️  To fix:
#    1. Remove the secret from your code
#    2. Add to .gitignore if it's a file
#    3. If false positive, add fingerprint to .gitleaksignore
```

### Bypassing the Hook (EMERGENCY ONLY)

```bash
# ⚠️ NEVER bypass unless absolutely necessary
git commit --no-verify -m "Emergency fix"
```

**When bypass is acceptable:**
- False positive that can't be resolved immediately
- Emergency production fix (but follow up with proper fix)
- NEVER bypass to commit actual secrets

### False Positives

If gitleaks flags a non-secret, add the fingerprint to `.gitleaksignore`:

```bash
# Get the fingerprint from gitleaks output
npm run scan:history
# Look for: Fingerprint: abc123:file.js:rule-name:42

# Add to .gitleaksignore
echo "abc123:file.js:rule-name:42" >> .gitleaksignore
```

### Pre-Public Repository Checklist

**Before making repository public:**
1. Run history scan: `npm run scan:history`
2. Review any flagged secrets
3. Remove secrets from history if found (use BFG Repo-Cleaner)
4. Verify `.gitignore` patterns are comprehensive
5. Test pre-commit hook: `git add -A && git commit -m "test"`

### Worktree Setup

Git hooks are **per-worktree**, so each worktree needs setup:

```bash
# Create worktree
git worktree add ../interview-prep-assistant-feature-name -b feature/name

# Navigate to worktree
cd ../interview-prep-assistant-feature-name

# Install hooks (if not auto-installed)
npm install  # Runs 'husky install' via prepare script
```

### Troubleshooting

**Hook not running:**
```bash
# Reinstall hooks
npm run prepare

# Check hook exists
ls -la .husky/pre-commit
```

**Gitleaks not found:**
```bash
# Install gitleaks
brew install gitleaks

# Verify installation
gitleaks version
```

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

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

### Low Level Design & Coding Standards

**Core Principle**: Write self-documenting, testable, maintainable code. Use classes for stateful logic, interfaces for contracts, and dependency injection throughout.

#### Architecture Pattern

**Three-Layer Architecture (Backend)**
```
Routes (HTTP layer) → Services (Business logic) → Repositories (Data access)
```
- **Routes**: Handle HTTP only (parsing, validation, response). Delegate to services.
- **Services**: Framework-agnostic business logic. Inject dependencies via constructor.
- **Repositories**: Abstract data access behind interfaces. Return domain objects, not raw rows.

**Component Architecture (Frontend)**
```
Container Components (data/state) → Presentational Components (pure UI)
Custom Hooks (reusable logic) ← API Client (type-safe HTTP)
```

#### SOLID Principles (Quick Reference)

1. **Single Responsibility**: Each class/function has ONE reason to change
   - Services handle business logic, routes handle HTTP, repositories handle data
2. **Open/Closed**: Use interfaces and dependency injection for extensibility
3. **Liskov Substitution**: Use interfaces to define contracts, ensure substitutability
4. **Interface Segregation**: Many specific interfaces > one general interface
5. **Dependency Inversion**: Depend on abstractions (interfaces), inject via constructor

#### OOP Guidelines

**When to Use Classes**
- Domain entities: `Problem`, `DailySelection`, `UserSettings`
- Services with dependencies: `SelectionService`, `CsvParser`
- Repositories: `SqliteProblemRepository`
- API clients: `ApiClient`

**Encapsulation**
- Private fields (prefix with `_`), readonly for immutability
- Public methods with explicit return types
- Hide implementation details

**Composition Over Inheritance**
- Use strategy pattern for algorithms
- Prefer interfaces + delegation over deep inheritance

#### TypeScript Standards

**Type Safety**
- Enable `strict: true` in tsconfig
- Never use `any` (use `unknown` or proper types)
- Explicit return types on public methods
- Discriminated unions for state: `{ status: 'loading' } | { status: 'success'; data: T }`

**Naming Conventions**
- Classes/Interfaces: `PascalCase` (interfaces: `IRepository` prefix for abstractions)
- Functions/methods: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Booleans: `isEligible`, `hasAttempts`, `shouldRetry`

**Function Design**
- One thing per function, < 30 lines
- Pure functions when possible
- No boolean parameters (use separate methods or strategy pattern)

**Immutability**
- `const` over `let`
- `readonly` for properties
- Spread operator for updates: `{ ...obj, field: newValue }`

#### Error Handling

- Custom error classes extending `DomainError`
- Throw domain errors for expected failures: `ProblemNotFoundError`, `InvalidColorTransitionError`
- Never swallow errors silently

#### Testing

- AAA pattern: Arrange, Act, Assert
- Descriptive names: `should return 5 problems when user setting is 5`
- Mock external dependencies (repositories, APIs)
- One assertion per test (or closely related)

#### Code Review Checklist
- [ ] Classes have single responsibility
- [ ] Dependencies injected via constructor
- [ ] No `any` types
- [ ] Public methods have return types
- [ ] Domain errors for failures
- [ ] No business logic in routes/components
- [ ] Tests cover happy + error paths
