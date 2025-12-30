/**
 * App header with navigation
 */

import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => `
    px-4 py-2 rounded-md text-sm font-medium transition-colors
    ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
    }
  `;

  return (
    <header className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">
              LeetCode Daily Selector
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-2">
            <Link to="/" className={navLinkClass('/')}>
              Dashboard
            </Link>
            <Link to="/problems" className={navLinkClass('/problems')}>
              All Problems
            </Link>
            <Link to="/stats" className={navLinkClass('/stats')}>
              Statistics
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
