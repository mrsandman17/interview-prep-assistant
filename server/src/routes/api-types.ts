/**
 * TypeScript types for API request and response payloads
 */

import { Problem, ProblemColor, Attempt } from '../db/types';

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
