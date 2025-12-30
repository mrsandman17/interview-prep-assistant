# LeetCode Daily Selector - Backend Server

Backend server for the LeetCode Daily Selector application - an Anki-style spaced repetition system for interview preparation.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4.x
- **Language**: TypeScript 5.x
- **Database**: SQLite (better-sqlite3)
- **Testing**: Vitest
- **Dev Tools**: tsx for hot-reloading

## Project Structure

```
server/
├── src/
│   ├── __tests__/       # Test files
│   ├── db/              # Database setup and schema
│   ├── routes/          # Express route handlers
│   ├── services/        # Business logic layer
│   └── index.ts         # Express app entry point
├── dist/                # Compiled JavaScript (gitignored)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
npm install
```

### Development

Start the development server with hot-reloading:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (configurable via `PORT` environment variable).

### Testing

Run tests in watch mode:

```bash
npm test
```

Run tests once:

```bash
npm test -- --run
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests with UI:

```bash
npm run test:ui
```

### Production Build

```bash
npm run build
npm start
```

## Available Endpoints

### Health Check

**GET** `/health`

Returns server status and timestamp.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T18:09:24.123Z"
}
```

## Development Workflow

This project follows **Test-Driven Development (TDD)**:

1. Write tests first (in `src/__tests__/`)
2. Run tests to see them fail
3. Implement minimal code to make tests pass
4. Refactor while keeping tests green
5. Repeat

**Never implement features without tests.**

## TypeScript Configuration

The project uses strict TypeScript settings:
- Strict mode enabled
- No unused locals or parameters
- No implicit returns
- No unchecked indexed access

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |

## Future API Endpoints

(To be implemented following TDD)

- `GET/POST /api/problems` - CRUD for problems
- `GET /api/daily` - Today's selection
- `POST /api/daily/:problemId/complete` - Mark complete
- `GET /api/stats` - Dashboard statistics
- `GET/PATCH /api/settings` - User preferences
