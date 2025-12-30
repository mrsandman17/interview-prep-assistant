/**
 * API client with typed fetch wrappers for all backend endpoints
 */

import type {
  Problem,
  DailySelection,
  CompleteProblemRequest,
  CompleteProblemResponse,
  Stats,
  Settings,
  UpdateSettingsRequest,
  CreateProblemRequest,
  UpdateProblemRequest,
  ImportProblemsRequest,
  ImportProblemsResponse,
  ApiError,
} from './types';

/**
 * Base fetch wrapper with error handling
 */
async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error);
  }

  return response.json();
}

/**
 * Problems API
 */
export const problemsApi = {
  /**
   * Get all problems
   */
  getAll: async (): Promise<Problem[]> => {
    return fetchJSON<Problem[]>('/api/problems');
  },

  /**
   * Create a new problem
   */
  create: async (data: CreateProblemRequest): Promise<Problem> => {
    return fetchJSON<Problem>('/api/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Import problems from CSV
   */
  importCSV: async (csvContent: string): Promise<ImportProblemsResponse> => {
    return fetchJSON<ImportProblemsResponse>('/api/problems/import', {
      method: 'POST',
      body: JSON.stringify({ csvContent } as ImportProblemsRequest),
    });
  },

  /**
   * Get a single problem by ID
   */
  getById: async (id: number): Promise<Problem> => {
    return fetchJSON<Problem>(`/api/problems/${id}`);
  },

  /**
   * Update a problem
   */
  update: async (id: number, data: UpdateProblemRequest): Promise<Problem> => {
    return fetchJSON<Problem>(`/api/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Daily Selection API
 */
export const dailyApi = {
  /**
   * Get today's selection (creates if needed)
   */
  getToday: async (): Promise<DailySelection> => {
    return fetchJSON<DailySelection>('/api/daily');
  },

  /**
   * Mark a problem as complete with color result
   */
  completeProblem: async (
    problemId: number,
    colorResult: CompleteProblemRequest['colorResult']
  ): Promise<CompleteProblemResponse> => {
    return fetchJSON<CompleteProblemResponse>(
      `/api/daily/${problemId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ colorResult } as CompleteProblemRequest),
      }
    );
  },

  /**
   * Refresh today's selection (generate new set)
   */
  refresh: async (): Promise<DailySelection> => {
    return fetchJSON<DailySelection>('/api/daily/refresh', {
      method: 'POST',
    });
  },
};

/**
 * Stats API
 */
export const statsApi = {
  /**
   * Get dashboard statistics
   */
  get: async (): Promise<Stats> => {
    return fetchJSON<Stats>('/api/stats');
  },
};

/**
 * Settings API
 */
export const settingsApi = {
  /**
   * Get user settings
   */
  get: async (): Promise<Settings> => {
    return fetchJSON<Settings>('/api/settings');
  },

  /**
   * Update user settings
   */
  update: async (data: UpdateSettingsRequest): Promise<Settings> => {
    return fetchJSON<Settings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
