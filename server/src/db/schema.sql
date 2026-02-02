-- LeetCode Daily Selector Database Schema
-- SQLite Database for Spaced Repetition Interview Prep

-- Problems table
-- Stores all LeetCode problems with current color state
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT 'gray' CHECK(color IN ('gray', 'orange', 'yellow', 'green')),
  key_insight TEXT,
  last_reviewed DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER DEFAULT 0
);

-- Attempt history table
-- Tracks all attempts at problems with their color results
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  color_result TEXT NOT NULL CHECK(color_result IN ('orange', 'yellow', 'green')),
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Daily selections table
-- Tracks which problems were selected for each day
CREATE TABLE IF NOT EXISTS daily_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  selected_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (problem_id) REFERENCES problems(id),
  UNIQUE(problem_id, selected_date)
);

-- Settings table (single row)
-- Stores user preferences and configuration
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_problem_count INTEGER DEFAULT 5 CHECK(daily_problem_count BETWEEN 3 AND 10),
  theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark'))
);

-- Initialize settings with default values
-- This ensures the settings table always has exactly one row
-- Use INSERT OR IGNORE to prevent errors on reinitialization
INSERT OR IGNORE INTO settings (id, daily_problem_count, theme)
VALUES (1, 5, 'light');
