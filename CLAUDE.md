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

**CRITICAL: MANDATORY Subagent Usage**

🚨 **YOU MUST USE SUBAGENTS FOR ALL NON-TRIVIAL WORK** 🚨

For every implementation task, you MUST use specialized subagents in parallel:

**Backend Implementation (REQUIRED):**
1. **backend-engineering-expert** - Design and implement API routes, services, database logic
2. **typescript-test-specialist** - Write comprehensive tests (TDD approach)
3. **ts-code-reviewer** - Review code before opening PR (catches security issues, bugs)

**Frontend Implementation (REQUIRED):**
1. **frontend-ux-engineer** - Design and implement UI components, pages, UX flows
2. **typescript-test-specialist** - Write component tests and integration tests
3. **ts-code-reviewer** - Review code before opening PR

**When to Use Each Agent:**
- Launch agents **at the START** of implementation, not after writing code yourself
- Use **Task tool with parallel invocations** when multiple agents can work simultaneously
- Example: Launch backend-engineering-expert AND typescript-test-specialist in parallel
- ONLY skip agents for trivial changes (typos, single-line fixes, documentation)

**Why This Matters:**
- Agents catch security vulnerabilities (SQL injection, race conditions)
- Agents enforce best practices and proper architecture
- Agents write better tests with comprehensive coverage
- Parallelization speeds up development by 2-3x

**Test-Driven Development (Streamlined)**

Write tests alongside implementation in quick iterations:
1. **Use typescript-test-specialist agent** - Let the agent write tests first or in parallel
2. **Use backend/frontend agents** - Let them implement following the test patterns
3. **Run tests frequently** - Verify all tests pass at feature completion
4. **Use ts-code-reviewer** - Review before committing

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
