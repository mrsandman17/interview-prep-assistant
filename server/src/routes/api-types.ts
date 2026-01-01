/**
 * TypeScript types for API request and response payloads
 */

import { Problem, ProblemColor, Attempt, AttemptColorResult } from '../db/types';

/**
 * Request body for creating a single problem
 */
export interface CreateProblemRequest {
  name: string;
  link: string;
  color?: ProblemColor;
  key_insight?: string;
}

/**
 * Request body for updating a problem
 */
export interface UpdateProblemRequest {
  name?: string;
  link?: string;
  color?: ProblemColor;
  key_insight?: string;
  last_reviewed?: string; // ISO date string
}

/**
 * Response for single problem with attempt history
 */
export interface ProblemWithAttempts extends Problem {
  attempts: Attempt[];
}

/**
 * Problem with attempt count (for list views)
 */
export interface ProblemWithAttemptCount extends Problem {
  attemptCount: number;
}

/**
 * Query parameters for GET /api/problems
 */
export interface GetProblemsQuery {
  color?: ProblemColor;
  search?: string;
}

/**
 * Response for CSV import operation
 */
export interface ImportResult {
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Problem with daily selection metadata
 */
export interface ProblemWithSelection extends Problem {
  selectionId: number;
  completed: boolean;
}

/**
 * Response for daily selection endpoints
 */
export interface DailySelectionResponse {
  problems: ProblemWithSelection[];
}

/**
 * Request body for completing a problem
 */
export interface CompleteProblemRequest {
  colorResult: AttemptColorResult;
}

/**
 * Response for completing a problem
 */
export interface CompleteProblemResponse {
  problem: ProblemWithSelection;
}
