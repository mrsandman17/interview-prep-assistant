# LeetCode Daily Selector - Frontend

React frontend for the LeetCode Daily Selector application.

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/          # API client and types
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Page components
├── App.tsx       # Main app component with routing
├── main.tsx      # Entry point
└── index.css     # Global styles with Tailwind
```

## API Client

The app communicates with the backend API running on `http://localhost:3000`. Vite is configured to proxy `/api` requests to the backend.

## Features

- Dashboard with daily problem selection
- Color-coded problem tracking (gray → orange → yellow → green)
- Problem completion with self-assessment
- Statistics overview
- Responsive design
