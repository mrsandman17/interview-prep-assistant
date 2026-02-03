/**
 * TypeScript interfaces matching backend API types
 */

export type ProblemColor = 'gray' | 'orange' | 'yellow' | 'green';

export interface Problem {
  id: number;
  name: string;
  link: string;
  color: ProblemColor;
  keyInsight: string | null;
  lastReviewed: string | null;
  createdAt: string;
  reviewCount: number;
  attemptCount?: number; // Deprecated, kept for backwards compatibility
}

export interface DailyProblem extends Problem {
  selectionId: number;
  completed: boolean;
}

export interface DailySelection {
  problems: DailyProblem[];
}

export interface CompleteProblemRequest {
  colorResult: Exclude<ProblemColor, 'gray'>;
}

export interface CompleteProblemResponse {
  problem: DailyProblem;
}

export interface ReviewProblemRequest {
  colorResult: Exclude<ProblemColor, 'gray'>;
  keyInsight?: string;
}

export interface ReviewProblemResponse {
  problem: Problem;
}

export interface Stats {
  totalProblems: number;
  greenProblems: number;
  currentStreak: number;
  readyForReview: number;
}

export interface Settings {
  dailyProblemCount: number;
}

export interface UpdateSettingsRequest {
  dailyProblemCount: number;
}

export interface CreateProblemRequest {
  name: string;
  link: string;
  keyInsight?: string;
  color?: ProblemColor;
}

export interface UpdateProblemRequest {
  name?: string;
  link?: string;
  keyInsight?: string;
  color?: ProblemColor;
}

export interface ImportProblemsRequest {
  csvContent: string;
}

export interface ImportProblemsResponse {
  imported: number;
  skipped: number;
}

export interface RandomInsight {
  problemId: number;
  problemName: string;
  problemLink: string;
  keyInsight: string;
}

export interface ApiError {
  error: string;
}
