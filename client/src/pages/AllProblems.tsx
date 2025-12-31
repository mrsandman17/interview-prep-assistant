/**
 * All Problems page - Full-featured problem management with table view
 */

import { useState, useEffect, useMemo, Component } from 'react';
import { problemsApi } from '../api/client';
import type { Problem, ProblemColor } from '../api/types';
import { ImportModal } from '../components/ImportModal';
import { FilterBar } from '../components/FilterBar';
import { ProblemsTable } from '../components/ProblemsTable';
import { EditProblemModal } from '../components/EditProblemModal';

/**
 * Error boundary to catch unexpected React errors
 */
class AllProblemsErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AllProblems error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Something went wrong. Please refresh the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AllProblemsContent() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ imported: number; skipped: number } | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<ProblemColor | 'all'>('all');

  // Edit modal state
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Fetch problems on mount and after import
  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await problemsApi.getAll();
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Filter problems based on search and color
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' ||
        problem.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Color filter
      const matchesColor = selectedColor === 'all' || problem.color === selectedColor;

      return matchesSearch && matchesColor;
    });
  }, [problems, searchQuery, selectedColor]);

  const handleImportSuccess = (result: { imported: number; skipped: number }) => {
    setImportSuccess(result);
    // Refetch problems after successful import
    fetchProblems();
    // Clear success message after 5 seconds
    setTimeout(() => setImportSuccess(null), 5000);
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
  };

  const handleSave = async (problemId: number, updates: {
    name?: string;
    link?: string;
    keyInsight?: string;
    color?: ProblemColor;
  }) => {
    try {
      const updatedProblem = await problemsApi.update(problemId, updates);

      // Update the problem in the local state using functional update to avoid races
      setProblems((prev) => {
        // Verify the problem still exists before updating
        const index = prev.findIndex(p => p.id === problemId);
        if (index === -1) return prev;

        const newProblems = [...prev];
        newProblems[index] = updatedProblem;
        return newProblems;
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update problem');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Problems</h2>
          <p className="mt-2 text-gray-600">
            Manage your LeetCode problem collection
          </p>
        </div>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="
            px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200
            flex items-center space-x-2
          "
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Import CSV</span>
        </button>
      </div>

      {/* Success Message */}
      {importSuccess && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Successfully imported {importSuccess.imported} problem{importSuccess.imported !== 1 ? 's' : ''}!
              </p>
              {importSuccess.skipped > 0 && (
                <p className="text-sm text-green-700 mt-1">
                  Skipped {importSuccess.skipped} duplicate{importSuccess.skipped !== 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                onClick={fetchProblems}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {/* Problems Table */}
      <ProblemsTable
        problems={filteredProblems}
        onEdit={handleEdit}
        isLoading={isLoading}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Edit Problem Modal */}
      <EditProblemModal
        problem={editingProblem}
        isOpen={!!editingProblem}
        onClose={() => setEditingProblem(null)}
        onSave={handleSave}
      />
    </div>
  );
}

/**
 * Main AllProblems component with error boundary
 */
export function AllProblems() {
  return (
    <AllProblemsErrorBoundary>
      <AllProblemsContent />
    </AllProblemsErrorBoundary>
  );
}
