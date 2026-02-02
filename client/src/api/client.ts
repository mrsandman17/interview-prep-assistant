/**
 * API client with typed fetch wrappers for all backend endpoints
 */

import type {
  Problem,
  DailyProblem,
  DailySelection,
  CompleteProblemRequest,
  CompleteProblemResponse,
  ReviewProblemRequest,
  ReviewProblemResponse,
  Stats,
  Settings,
  UpdateSettingsRequest,
  CreateProblemRequest,
  UpdateProblemRequest,
  ImportProblemsRequest,
  ImportProblemsResponse,
  RandomInsight,
  ApiError,
} from './types';

/**
 * Transform snake_case object keys to camelCase
 */
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = typeof value === 'object' ? toCamelCase(value) : value;
  }
  return camelObj;
}

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
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return toCamelCase(data);
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
    // Transform camelCase to snake_case for backend
    const payload = {
      name: data.name,
      link: data.link,
      ...(data.keyInsight && { key_insight: data.keyInsight }),
      ...(data.color && { color: data.color }),
    };

    return fetchJSON<Problem>('/api/problems', {
      method: 'POST',
      body: JSON.stringify(payload),
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
   * Export all problems as CSV
   */
  exportCSV: async (): Promise<string> => {
    const response = await fetch('/api/problems/export', {
      method: 'GET',
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `Failed to export problems: HTTP ${response.status}`);
    }

    return response.text();
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
    // Transform camelCase to snake_case for backend
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.link !== undefined) payload.link = data.link;
    if (data.color !== undefined) payload.color = data.color;
    if (data.keyInsight !== undefined) payload.key_insight = data.keyInsight;

    return fetchJSON<Problem>(`/api/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a problem (cascade deletes attempts and daily selections)
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/problems/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || `Failed to delete problem: HTTP ${response.status}`);
    }
  },

  /**
   * Manually review a problem (not part of daily selection)
   */
  reviewProblem: async (
    id: number,
    colorResult: ReviewProblemRequest['colorResult']
  ): Promise<Problem> => {
    const response = await fetchJSON<ReviewProblemResponse>(
      `/api/problems/${id}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ colorResult }),
      }
    );
    return response.problem;
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

  /**
   * Replace a specific problem in today's selection
   */
  replaceProblem: async (problemId: number): Promise<{ problem: DailyProblem }> => {
    return fetchJSON<{ problem: DailyProblem }>(`/api/daily/${problemId}/replace`, {
      method: 'POST',
    });
  },

  /**
   * Get a random key insight from problems (excluding specified IDs)
   */
  getRandomInsight: async (excludeIds: number[] = []): Promise<RandomInsight | null> => {
    const query = excludeIds.length > 0
      ? `?exclude=${excludeIds.join(',')}`
      : '';
    return fetchJSON<RandomInsight | null>(`/api/daily/random-insight${query}`);
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
