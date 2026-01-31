# LeetCode Daily Selector

An Anki-style spaced repetition app for LeetCode interview preparation. This application helps you master coding interview problems through scientifically-proven spaced repetition techniques, ensuring efficient learning and long-term retention.

## Features

- **Smart Daily Selection**: Automatically selects 3-5 problems daily based on spaced repetition algorithm
- **Color-Based Progress Tracking**: Problems progress from gray (new) → orange → yellow → green (mastered)
- **Adaptive Review Schedule**: Intelligently schedules reviews based on your performance
  - Gray (new): Always available
  - Orange: Review after 3+ days
  - Yellow: Review after 7+ days
  - Green (mastered): Review after 14+ days
- **CSV Import**: Bulk import problems from LeetCode or custom CSV files
- **CSV Export**: Export your problem list for backup or sharing
- **Progress Statistics**: Track your learning progress with detailed stats
- **Individual Problem Replacement**: Swap out specific daily problems if needed
- **Comprehensive Problem Management**: Add, edit, and organize your problem set

## Tech Stack

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Testing**: Vitest + Supertest

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 18+ and npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/interview-prep-assistant.git
cd interview-prep-assistant
```

2. Install dependencies for both backend and frontend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Initialize the database (automatically created on first run)

## Usage

### Starting the Application

1. Start the backend server:
```bash
cd server
npm run dev
```
The server will run on `http://localhost:3000`

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

### Daily Workflow

1. **Dashboard**: View your daily selection of problems
2. **Practice**: Work on each problem on LeetCode
3. **Record Result**: Mark each problem with your performance color (gray/orange/yellow/green)
4. **Track Progress**: Check your stats and progress over time

### Managing Problems

- **All Problems Page**: View and manage your entire problem set
- **Add Problems**: Manually add problems or import via CSV
- **Export**: Download your problem list as CSV
- **Replace Problems**: Swap individual problems in your daily selection

## Project Structure

```
interview-prep-assistant/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API client and types
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Main application pages
│   │   └── App.tsx        # Root component
│   └── package.json
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── db/            # Database setup and schema
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic layer
│   │   └── index.ts       # Server entry point
│   └── package.json
└── README.md
```

## Development

### Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build backend
cd server
npm run build
npm start

# Build frontend
cd client
npm run build
npm run preview
```

### Architecture Highlights

- **Three-Layer Architecture**: Routes → Services → Repositories
- **Dependency Injection**: Services receive dependencies via constructor
- **Type Safety**: Strict TypeScript with explicit types throughout
- **Test Coverage**: Comprehensive unit and integration tests
- **SOLID Principles**: Clean, maintainable, and extensible code

## API Endpoints

- `GET/POST /api/problems` - CRUD operations for problems
- `GET /api/daily` - Retrieve today's problem selection
- `POST /api/daily/:problemId/complete` - Mark problem as complete
- `POST /api/daily/:problemId/replace` - Replace a specific problem in daily selection
- `GET /api/stats` - Retrieve dashboard statistics
- `GET/PATCH /api/settings` - User preferences
- `POST /api/problems/import` - Import problems from CSV
- `GET /api/problems/export` - Export problems to CSV

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

**Built with [Claude Code](https://claude.ai/code)** - An AI-powered development tool by Anthropic
