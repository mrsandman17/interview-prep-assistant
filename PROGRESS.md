# LeetCode Daily Selector - Implementation Progress

**Status**: In Progress
**Last Updated**: 2025-12-30
**Project**: Interview Prep Assistant
**Workflow**: Streamlined TDD, parallelized where possible, consolidated PRs

---

## Progress Overview

**Total Progress**: 4/8 PRs complete (50%) - PR #4 pending merge
**Original Plan**: 21 individual steps → **Consolidated to 8 feature PRs**

### MVP Requirements

**✅ REQUIRED FOR MVP (3 PRs):**
- **PR 1**: Backend Foundation - ✅ COMPLETE (PR #4 pending merge)
- **PR 2**: Selection Algorithm - 🔄 READY TO START (backend logic for daily selection)
- **PR 3**: Frontend Foundation + Dashboard - ⏳ PENDING (UI to interact with the app)

**🎁 NICE-TO-HAVE ENHANCEMENTS (5 PRs):**
- **PR 4**: Key Insights + Stats (analytics and insights capture)
- **PR 5**: All Problems View (table view with sorting/filtering)
- **PR 6**: Settings & Import/Export (configuration and data management)
- **PR 7**: Polish & Error Handling (UX improvements)
- **PR 8**: Final Integration & Testing (e2e tests)

**Status**: 1/3 MVP PRs complete (33%) - **2 more PRs to working app**

---

## 🚨 CRITICAL: Subagent Usage Policy 🚨

**MANDATORY FOR ALL TASKS**: You MUST use specialized subagents for every non-trivial implementation task.

**Backend Tasks (REQUIRED agents):**
1. ✅ **backend-engineering-expert** - Launch FIRST to design/implement routes, services, DB logic
2. ✅ **typescript-test-specialist** - Launch IN PARALLEL to write comprehensive tests
3. ✅ **ts-code-reviewer** - Launch LAST before PR to review and catch security issues

**Frontend Tasks (REQUIRED agents):**
1. ✅ **frontend-ux-engineer** - Launch FIRST to design/implement UI components
2. ✅ **typescript-test-specialist** - Launch IN PARALLEL to write component tests
3. ✅ **ts-code-reviewer** - Launch LAST before PR to review code

**DO NOT skip agents unless the task is trivial (typo, single-line fix, docs only)**

---

## PR 1: Backend Foundation (4/4 tasks complete) ✅ 100% DONE - PR #4 [REQUIRED FOR MVP]

- [x] **1.1 - Initialize Backend Project** ✅ COMPLETE
  - Create /server directory with Node.js + Express + TypeScript
  - Set up package.json, tsconfig.json, basic Express server
  - **REQUIRED Subagents**: ⚠️ backend-engineering-expert, typescript-test-specialist (NOT USED - implemented manually)
  - **Files**: package.json, tsconfig.json, src/index.ts, test config
  - **Completed**: 2025-12-29
  - **Notes**: All 5 tests passing. Used Vitest for testing, tsx for dev server.

- [x] **1.2 - Set Up SQLite Database** ✅ COMPLETE
  - Implement schema with 4 tables (problems, attempts, daily_selections, settings)
  - Database initialization and migration logic
  - **REQUIRED Subagents**: ⚠️ backend-engineering-expert, typescript-test-specialist (NOT USED - implemented manually)
  - **Files**: db/schema.sql, db/index.ts, db/types.ts, db tests
  - **Completed**: 2025-12-29
  - **Notes**: 23 comprehensive tests passing. Schema with CHECK constraints, foreign keys,
    settings table with defaults. Database location: server/data/leetcode.db.
    Integrated with server startup and graceful shutdown.

- [x] **1.3 - CSV Parser & Import** ✅ COMPLETE
  - Parse CSV files with problem data
  - Handle duplicates, validate colors/dates
  - **REQUIRED Subagents**: ⚠️ backend-engineering-expert, typescript-test-specialist (NOT USED - implemented manually)
  - **Files**: services/csv-parser.ts, tests
  - **Completed**: 2025-12-29
  - **Notes**: 28 comprehensive tests passing. Uses `csv-parse` library for robust parsing.
    Validates colors (defaults to gray), dates (ISO format), URLs (http/https required).
    Detects duplicate links and returns both successful parses and errors (partial success model).
    Handles edge cases: empty CSV, quoted fields, CRLF/LF line endings, whitespace trimming.

- [x] **1.4 - Problems CRUD Endpoints** ✅ COMPLETE
  - GET/POST /api/problems, POST /api/problems/import
  - GET/PATCH /api/problems/:id
  - **Subagents Used**: ✅ ts-code-reviewer (caught SQL injection, race conditions)
  - **Subagents MISSED**: ⚠️ backend-engineering-expert, typescript-test-specialist (implemented manually, then fixed issues)
  - **Files**: routes/problems.ts, routes/api-types.ts, tests
  - **Completed**: 2025-12-30
  - **Notes**: 40 tests passing (112 total). Code reviewer found critical SQL injection vulnerability,
    race condition in CSV import, and type safety issues. All fixed with transactions, escaped LIKE queries,
    and proper TypeScript types. **LESSON: Using agents from the start would have prevented these issues.**

---

## PR 2: Selection Algorithm (0/4 tasks complete) 🔄 READY TO START [REQUIRED FOR MVP]

**Combines**: Phase 2.1-2.4 (all selection logic in one PR)
**Parallelizable**: All 4 tasks can be worked on simultaneously by different agents
**MVP Critical**: Core spaced repetition algorithm - enables daily problem selection

**IMPLEMENTATION STRATEGY - USE AGENTS IN PARALLEL:**
1. Launch **backend-engineering-expert** for task 2.1 (eligibility queries)
2. Launch **backend-engineering-expert** for task 2.2 (selection algorithm)
3. Launch **backend-engineering-expert** for task 2.3 (daily endpoints)
4. Launch **typescript-test-specialist** for all test files (can write tests for all services)
5. Launch **ts-code-reviewer** at the end before PR

- [ ] **2.1 - Eligibility Queries**
  - Implement getEligibleNew(), getEligibleReview(), getEligibleMastered()
  - Filter by date thresholds (3/7/14 days)
  - **REQUIRED Subagents**: backend-engineering-expert (service logic), typescript-test-specialist (tests)
  - **Files**: services/selection.ts, tests

- [ ] **2.2 - Selection Algorithm Implementation**
  - Implement 50/40/10 ratio selection logic
  - Handle empty pool redistribution
  - **REQUIRED Subagents**: backend-engineering-expert (algorithm logic), typescript-test-specialist (tests)
  - **Files**: services/selection.ts (add selectDaily), tests

- [ ] **2.3 - Daily Selection Endpoints**
  - GET /api/daily, POST /api/daily/:problemId/complete, POST /api/daily/refresh
  - **REQUIRED Subagents**: backend-engineering-expert (routes), typescript-test-specialist (tests)
  - **Files**: routes/daily.ts, tests

- [ ] **2.4 - Completion Logic & Color Transitions**
  - Update color: gray→orange→yellow→green
  - Update last_reviewed, insert attempt, mark completed
  - **REQUIRED Subagents**: backend-engineering-expert (transitions), typescript-test-specialist (tests)
  - **Files**: routes/daily.ts (transitions), tests

- [ ] **2.5 - Final Code Review**
  - **REQUIRED Subagent**: ts-code-reviewer (review all code before PR)
  - Review for security issues, bugs, best practices

---

## PR 3: Frontend Foundation + Dashboard (0/4 tasks complete) [REQUIRED FOR MVP]

**Combines**: Phase 3.1-3.4 (complete frontend setup + first page)
**Parallelizable**: API client + Hooks can be built while Dashboard is being designed
**MVP Critical**: User interface to view daily problems and submit completions

- [ ] **3.1 - Initialize Frontend Project**
  - Create /client with React + Vite + TypeScript + Tailwind
  - Configure Tailwind, Vite, proxy to backend
  - **Files**: package.json, tsconfig.json, vite.config.ts, tailwind.config.js, main.tsx, App.tsx

- [ ] **3.2 - API Client**
  - Typed fetch wrappers for all endpoints
  - Error handling, TypeScript interfaces
  - **Files**: api/client.ts, api/types.ts, tests

- [ ] **3.3 - Custom Hooks**
  - useProblems(), useDaily(), useStats()
  - Loading/error states
  - **Files**: hooks/useProblems.ts, hooks/useDaily.ts, hooks/useStats.ts, tests

- [ ] **3.4 - Dashboard Page & Problem Cards**
  - Main daily practice view
  - ProblemCard with pending/completed states, color button selection
  - **Files**: pages/Dashboard.tsx, components/ProblemCard.tsx, components/ColorButton.tsx, tests

---

## PR 4: Key Insights + Stats (0/3 tasks complete) [OPTIONAL ENHANCEMENT]

**Combines**: Phase 4.1 + 5.1-5.2 (insights feature + stats together)
**Parallelizable**: Backend stats endpoint + Frontend components can be built simultaneously
**Enhancement**: Adds insights capture and analytics dashboard

- [ ] **4.1 - Key Insight Modal/Editor**
  - Textarea/modal for capturing insights
  - Show after color selection, pre-fill if exists
  - **Files**: components/KeyInsightModal.tsx, tests

- [ ] **5.1 - Stats API Endpoint**
  - GET /api/stats with color distribution, ready for review, streak, progress
  - **Files**: routes/stats.ts, tests

- [ ] **5.2 - Stats Dashboard**
  - Charts (color distribution, progress over time)
  - Metrics (streak, ready for review)
  - **Files**: pages/Stats.tsx, components/StatsCard.tsx, components/ProgressChart.tsx, tests

---

## PR 5: All Problems View (0/2 tasks complete) [OPTIONAL ENHANCEMENT]

**Combines**: Phase 6.1-6.2 (table + inline editing together)
**Enhancement**: Adds sortable/filterable table view for all problems

- [ ] **6.1 - Problems Table Component**
  - Sortable (name, color, last reviewed, attempts)
  - Filterable (by color), searchable (by name)
  - **Files**: pages/AllProblems.tsx, components/ProblemsTable.tsx, tests

- [ ] **6.2 - Inline Editing**
  - Edit color dropdown, key insight textarea in table
  - Save on blur, loading states
  - **Files**: components/ProblemsTable.tsx (add editing), tests

---

## PR 6: Settings & Import/Export (0/3 tasks complete) [OPTIONAL ENHANCEMENT]

**Combines**: Phase 7.1-7.3 (all settings features together)
**Parallelizable**: Backend settings API + Frontend modal + Import/Export UI can be built simultaneously
**Enhancement**: Adds configuration UI and CSV import/export features

- [ ] **7.1 - Settings API**
  - GET/PATCH /api/settings (daily_problem_count, theme)
  - **Files**: routes/settings.ts, tests

- [ ] **7.2 - Settings Modal**
  - Daily problem count slider (3-5)
  - Theme toggle (light/dark), Tailwind dark mode
  - **Files**: components/SettingsModal.tsx, tests

- [ ] **7.3 - Import/Export Features**
  - ImportModal with file upload
  - CSV export functionality
  - **Files**: components/ImportModal.tsx, components/AddProblemForm.tsx, tests

---

## PR 7: Polish & Error Handling (0/1 task complete) [OPTIONAL ENHANCEMENT]

**Standalone**: Phase 7.4 (final polish across all components)
**Enhancement**: UX refinements, error boundaries, responsive design

- [ ] **7.4 - Error Handling & Polish**
  - Error boundaries, toast notifications
  - Loading skeletons, responsive design, accessibility
  - **Files**: All components (refinements)

---

## PR 8: Final Integration & Testing [OPTIONAL ENHANCEMENT]

**New**: End-to-end testing and final integration
**Enhancement**: Comprehensive e2e tests and integration testing

- [ ] **8.1 - Integration Testing**
  - End-to-end user workflows
  - Cross-component interactions
  - Performance testing
  - **Files**: e2e tests, integration tests

---

## Code Review Strategy

**Single Review Point**: Code review happens once per PR before merge (not continuously)
- Review after tests pass
- Fix issues identified
- Merge when approved

---

## Notes & Decisions

### Phase 1.1 - Backend Initialization
- **Testing Framework**: Chose Vitest over Jest for better TypeScript/ESM support
- **Dev Server**: Using `tsx` for fast TypeScript execution with hot-reload
- **Database Library**: `better-sqlite3` included but not yet configured
- **Git Worktree**: Working in `feature/backend-initialization` branch at `/Users/amitzandman/Development/interview-prep-assistant-backend-init`

### Phase 1.2 - SQLite Database Setup
- **Database Library**: Using `better-sqlite3` with synchronous API for simplicity
- **Schema Strategy**: `CREATE TABLE IF NOT EXISTS` for idempotency, `INSERT OR IGNORE` for settings
- **Connection Pattern**: Singleton pattern to ensure single connection throughout app lifecycle
- **Test Coverage**: 23 tests covering schema validation, constraints, defaults, and connection management
- **Graceful Shutdown**: SIGINT/SIGTERM handlers close database connection cleanly
- **Migration Strategy**: Simple schema execution; future migrations can use version tracking if needed
- **TypeScript Types**: Complete type definitions for all tables (Problem, Attempt, DailySelection, Settings)

### Phase 1.3 - CSV Parser & Import
- **CSV Library**: Using `csv-parse` (industry-standard, battle-tested) for robust CSV parsing
- **Validation Strategy**: Three-layer validation: required fields (name, link), format validation (color, date, URL), duplicate detection
- **Error Model**: Partial success - returns both successful parses AND errors (doesn't fail completely on partial errors)
- **Color Handling**: Validates against schema colors (gray, orange, yellow, green), defaults to gray for invalid/empty
- **Date Validation**: Strict ISO format (YYYY-MM-DD), rejects invalid dates like Feb 30
- **URL Validation**: Requires http:// or https:// protocol, uses URL constructor for validation
- **Duplicate Detection**: Tracks links in a Set, reports duplicate rows with row numbers
- **Edge Cases**: Handles empty CSV, headers only, quoted fields with commas/newlines, CRLF/LF line endings, whitespace
- **Test Coverage**: 28 comprehensive tests covering all validation rules and edge cases
- **Git Worktree**: Working in `feature/csv-parser-import` branch at `/Users/amitzandman/Development/interview-prep-assistant-csv-parser`

---

## Next Steps

**Current PR**: PR 1 - Backend Foundation (100% complete) - PR #4 pending merge
**Next PR**: PR 2 - Selection Algorithm (ready to start)

### Path to MVP (2 more PRs)

**Immediate To Do**:
1. ✅ Merge PR #4 when approved
2. 🚀 **PR 2 - Selection Algorithm** using **MANDATORY SUBAGENT WORKFLOW**:
   - Launch backend-engineering-expert agents in parallel for 2.1, 2.2, 2.3
   - Launch typescript-test-specialist for all test files
   - Run ts-code-reviewer before opening PR
3. 🚀 **PR 3 - Frontend Foundation + Dashboard**:
   - Launch frontend-ux-engineer for UI design and implementation
   - Launch typescript-test-specialist for component tests
   - Run ts-code-reviewer before opening PR

**After MVP**: Consider implementing optional enhancements (PRs 4-8) based on user needs

**🚨 CRITICAL REMINDER: USE SUBAGENTS FROM THE START 🚨**
- DO NOT implement code manually first
- Launch agents at the BEGINNING of each task
- Use parallel agent invocations for speed
- Agents prevent security issues and ensure best practices

**Optimization Benefits**:
- **From 21 PRs → 8 PRs** (62% reduction in PR overhead)
- **Parallelization**: Multiple tasks within each PR can be built simultaneously
- **Streamlined TDD**: Tests + implementation together, not strict test-first
- **Single review**: Only at PR time, not continuously
- **Skills removed**: ~10k tokens freed up (interview-technique-coach, leetcode-analyzer, spaced-repetition-coach, algorithm-pattern-reference backed up to .claude/skills-backup/)
- **Subagent usage**: Catches bugs early, enforces best practices, speeds development 2-3x