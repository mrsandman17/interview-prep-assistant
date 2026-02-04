/**
 * TypeScript type definitions for database tables
 */

/**
 * Valid color values for problem progression
 * gray (new) -> orange -> yellow -> green (mastered)
 */
export type ProblemColor = 'gray' | 'orange' | 'yellow' | 'green';

/**
 * Valid color results for attempt outcomes
 * Cannot be gray (attempts only occur after first try)
 */
export type AttemptColorResult = 'orange' | 'yellow' | 'green';

/**
 * Valid theme options
 */
export type Theme = 'light' | 'dark';

/**
 * Problem record from the database
 */
export interface Problem {
  id: number;
  name: string;
  link: string;
  color: ProblemColor;
  key_insight: string | null;
  last_reviewed: string | null; // ISO date string (YYYY-MM-DD)
  created_at: string; // ISO datetime string
}

/**
 * Input for creating a new problem
 */
export interface NewProblem {
  name: string;
  link: string;
  color?: ProblemColor;
  key_insight?: string | null;
}

/**
 * Input for updating an existing problem
 */
export interface UpdateProblem {
  name?: string;
  link?: string;
  color?: ProblemColor;
  key_insight?: string | null;
  last_reviewed?: string | null;
}

/**
 * Attempt record from the database
 */
export interface Attempt {
  id: number;
  problem_id: number;
  attempted_at: string; // ISO datetime string
  color_result: AttemptColorResult;
}

/**
 * Input for creating a new attempt
 */
export interface NewAttempt {
  problem_id: number;
  color_result: AttemptColorResult;
}

/**
 * Daily selection record from the database
 */
export interface DailySelection {
  id: number;
  problem_id: number;
  selected_date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
}

/**
 * Input for creating a new daily selection
 */
export interface NewDailySelection {
  problem_id: number;
  selected_date: string;
  completed?: boolean;
}

/**
 * Settings record from the database
 * Note: Only one row should exist (id = 1)
 */
export interface Settings {
  id: 1;
  daily_problem_count: number; // 3-5
  theme: Theme;
}

/**
 * Input for updating settings
 */
export interface UpdateSettings {
  daily_problem_count?: number;
  theme?: Theme;
}

/**
 * Topic record from the database
 */
export interface Topic {
  id: number;
  name: string;
  created_at: string; // ISO datetime string
}

/**
 * Input for creating a new topic
 */
export interface NewTopic {
  name: string;
}

/**
 * Problem with associated topics
 */
export interface ProblemWithTopics extends Problem {
  topics: Topic[];
}
