# LeetCode Daily Selector - Implementation Plan

## Overview
An Anki-style spaced repetition app for LeetCode interview prep. Node.js + Express backend with SQLite, React + TypeScript + Tailwind frontend. Local deployment, single user.

## Tech Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3 or sqlite3)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Vite for frontend, ts-node or tsx for backend
- **Monorepo**: Single repo with `/client` and `/server` folders

---

## Data Model

### Tables

```sql
-- Problems table
CREATE TABLE problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT 'gray' CHECK(color IN ('gray', 'orange', 'yellow', 'green')),
  key_insight TEXT,
  last_reviewed DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attempt history table
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  color_result TEXT NOT NULL CHECK(color_result IN ('orange', 'yellow', 'green')),
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Daily selections (track what was selected today)
CREATE TABLE daily_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  selected_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (problem_id) REFERENCES problems(id),
  UNIQUE(problem_id, selected_date)
);

-- Settings table (single row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_problem_count INTEGER DEFAULT 5 CHECK(daily_problem_count BETWEEN 3 AND 10),
  theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark'))
);
```

### CSV Import Format
```
Problem,Link,Color,LastReviewed,KeyInsight
Two Sum,https://leetcode.com/problems/two-sum,gray,,
Valid Parentheses,https://leetcode.com/problems/valid-parentheses,yellow,2024-01-15,Use a stack
```

---

## Selection Algorithm (Spaced Repetition)

### Eligibility Thresholds
- **Gray (new)**: Always eligible
- **Orange**: Eligible if `last_reviewed` is 3+ days ago (or null)
- **Yellow**: Eligible if `last_reviewed` is 7+ days ago (or null)
- **Green**: Eligible if `last_reviewed` is 14+ days ago (or null)

### Selection Ratio (configurable 3-10 problems)
- **50%** from NEW pool (gray)
- **40%** from REVIEW pool (eligible orange + yellow)
- **10%** from MASTERED pool (eligible green)
- User can configure daily count (3-10) in settings

### Algorithm Pseudocode
```
1. Get all eligible problems by pool:
   - NEW: color = 'gray' AND not selected today
   - REVIEW: (color = 'orange' AND last_reviewed <= today - 3 days)
          OR (color = 'yellow' AND last_reviewed <= today - 7 days)
          AND not selected today
   - MASTERED: color = 'green' AND last_reviewed <= today - 14 days
               AND not selected today

2. Calculate target counts (for 5 problems):
   - NEW: ceil(5 * 0.5) = 3
   - REVIEW: ceil(5 * 0.4) = 2
   - MASTERED: floor(5 * 0.1) = 0 (at least 1 if pool not empty)

3. Randomly select from each pool up to target
4. If a pool is empty, redistribute to other pools
5. Return 3-5 problems total
```

---

## API Endpoints

### Problems
- `GET /api/problems` - List all problems (with filters)
- `POST /api/problems` - Add single problem (name, link)
- `POST /api/problems/import` - Import from CSV (additive)
- `GET /api/problems/:id` - Get single problem with attempt history
- `PATCH /api/problems/:id` - Update problem (color, key_insight)

### Daily Selection
- `GET /api/daily` - Get today's selection (creates if doesn't exist)
- `POST /api/daily/:problemId/complete` - Mark problem completed with color
- `POST /api/daily/refresh` - Generate new selection for today

### Stats
- `GET /api/stats` - Dashboard statistics
  - Color distribution
  - Problems ready for review
  - Current streak
  - Progress over time (weekly/monthly)

### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings (daily_problem_count, theme)

### Attempts
- `GET /api/problems/:id/attempts` - Get attempt history for a problem

---

## Frontend Structure

```
/client
  /src
    /components
      Header.tsx
      ProblemCard.tsx
      ColorButton.tsx
      KeyInsightModal.tsx
      StatsCard.tsx
      ProgressChart.tsx
      ImportModal.tsx
      AddProblemForm.tsx
      ProblemsTable.tsx
      SettingsModal.tsx
    /pages
      Dashboard.tsx        # Main daily view
      AllProblems.tsx      # Table of all problems
      Stats.tsx            # Progress dashboard
    /hooks
      useProblems.ts
      useDaily.ts
      useStats.ts
    /api
      client.ts            # API client
    App.tsx
    main.tsx
```

---

## UI Components

### Dashboard (Main Page)
```
┌─────────────────────────────────────────────────────┐
│  LeetCode Daily Selector    [Add] [Import] [⚙️]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Today's Practice (2/4 completed)     [New Set]    │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔵 Two Sum                                    │ │
│  │ leetcode.com/problems/two-sum  [Open →]       │ │
│  │                                               │ │
│  │ How did it go?  [🟢] [🟡] [🟠]               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ✓ Valid Parentheses              🟢 Mastered  │ │
│  │ Key Insight: Use a stack, LIFO matches...     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────┬─────────┬─────────┬─────────┐        │
│  │Ready: 12│Streak: 5│Green: 20│Total: 85│        │
│  └─────────┴─────────┴─────────┴─────────┘        │
└─────────────────────────────────────────────────────┘
```

### Problem Card States
1. **Pending**: Shows problem name + link, color buttons visible, insight hidden
2. **Completed**: Shows result color, reveals key insight (editable)

### Stats Page
- **Color Distribution**: Bar or pie chart (gray/orange/yellow/green)
- **Progress Over Time**: Line chart showing problems mastered per week
- **Current Streak**: Number with flame icon
- **Ready for Review**: Count of eligible problems by color

### All Problems Table
- Sortable columns: Name, Color, Last Reviewed, Attempts
- Filter by color
- Click to edit problem details
- Search by name

---

## Implementation Order

### Phase 1: Backend Foundation
1. Initialize Node.js + Express + TypeScript project
2. Set up SQLite database with schema (including settings table)
3. Implement CSV parser and import endpoint
4. Implement problems CRUD endpoints (including single add)

### Phase 2: Selection Algorithm
5. Implement eligibility queries
6. Implement selection algorithm with ratio distribution
7. Implement daily selection endpoints
8. Implement completion/marking endpoint

### Phase 3: Frontend Foundation
9. Initialize React + Vite + TypeScript + Tailwind
10. Create API client
11. Build Dashboard page with problem cards
12. Implement color selection flow

### Phase 4: Key Insight Feature
13. Add key insight modal/inline editor
14. Show insight only after completion
15. Save insight to database

### Phase 5: Stats & Progress
16. Implement stats API endpoint
17. Build stats dashboard with charts
18. Implement streak calculation
19. Add progress over time visualization

### Phase 6: All Problems View
20. Build sortable/filterable table
21. Add inline editing
22. Add search functionality

### Phase 7: Settings & Polish
23. Implement settings API and modal (theme, daily count)
24. Dark/light theme toggle
25. Export functionality
26. Error handling and loading states
27. Responsive design refinements

---

## File Structure

```
/interview-prep-assistant
  /server
    /src
      /routes
        problems.ts
        daily.ts
        stats.ts
      /db
        schema.sql
        index.ts
      /services
        selection.ts
        csv-parser.ts
      index.ts
    package.json
    tsconfig.json
  /client
    /src
      /components
      /pages
      /hooks
      /api
      App.tsx
      main.tsx
    package.json
    tsconfig.json
    tailwind.config.js
    vite.config.ts
  package.json (workspace root)
```

---

## Key Implementation Notes

1. **CSV Import**: Use additive merge - skip duplicates by link URL
2. **Date Handling**: Use UTC dates for consistency
3. **Streak Calculation**: Count consecutive days with at least 1 completion
4. **Key Insight UX**: Textarea appears after marking color, pre-filled if exists
5. **Selection Persistence**: Store daily selection in DB, not regenerated on refresh
