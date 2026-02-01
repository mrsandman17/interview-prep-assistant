/**
 * All Problems page - Full-featured problem management with table view
 */

import { useState, useEffect, useMemo, Component } from 'react';
import { problemsApi } from '../api/client';
import type { Problem, ProblemColor, CreateProblemRequest } from '../api/types';
import { ImportModal } from '../components/ImportModal';
import { FilterBar } from '../components/FilterBar';
import { ProblemsTable } from '../components/ProblemsTable';
import { EditProblemModal } from '../components/EditProblemModal';
import { AddProblemModal } from '../components/AddProblemModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

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

  // Export state
  const [exportSuccess, setExportSuccess] = useState(false);

  // Add problem modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<ProblemColor | 'all'>('all');

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Edit modal state
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Delete modal state
  const [deletingProblem, setDeletingProblem] = useState<Problem | null>(null);

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

  // Reset expanded row when filters change
  useEffect(() => {
    setExpandedRowId(null);
  }, [searchQuery, selectedColor]);

  const handleImportSuccess = (result: { imported: number; skipped: number }) => {
    setImportSuccess(result);
    // Refetch problems after successful import
    fetchProblems();
  };

  const handleExport = async () => {
    try {
      setError(null);
      const csvContent = await problemsApi.exportCSV();

      // Create a Blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date (format: problems-YYYY-MM-DD.csv)
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      link.download = `problems-${date}.csv`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      setExportSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export problems');
    }
  };

  // Clear import success message after 5 seconds
  useEffect(() => {
    if (importSuccess) {
      const timeoutId = setTimeout(() => setImportSuccess(null), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [importSuccess]);

  // Clear export success message after 3 seconds
  useEffect(() => {
    if (exportSuccess) {
      const timeoutId = setTimeout(() => setExportSuccess(false), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [exportSuccess]);

  const handleRowToggle = (problemId: number) => {
    setExpandedRowId((prev) => (prev === problemId ? null : problemId));
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
  };

  const handleCreate = async (data: CreateProblemRequest) => {
    try {
      const newProblem = await problemsApi.create(data);

      // Add the new problem to the local state (with duplicate check)
      setProblems((prev) => {
        // Prevent duplicate entries
        if (prev.some(p => p.id === newProblem.id)) {
          return prev;
        }
        return [...prev, newProblem];
      });

      // Show success message
      setAddSuccess(newProblem.name);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create problem');
    }
  };

  // Clear add success message after 5 seconds
  useEffect(() => {
    if (addSuccess) {
      const timeoutId = setTimeout(() => setAddSuccess(null), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [addSuccess]);

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

  const handleDelete = (problem: Problem) => {
    setDeletingProblem(problem);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProblem) return;

    // Capture reference to prevent race conditions
    const problemToDelete = deletingProblem;

    try {
      await problemsApi.delete(problemToDelete.id);

      // Remove from local state using functional update
      setProblems((prev) => prev.filter(p => p.id !== problemToDelete.id));

      // Close modal
      setDeletingProblem(null);
    } catch (err) {
      // Error is already displayed in modal, just rethrow
      throw err;
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="
              px-6 py-3 bg-green-600 text-white rounded-lg font-medium
              hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              transition-colors duration-200
              flex items-center space-x-2
            "
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Problem</span>
          </button>
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
          <button
            onClick={handleExport}
            disabled={isLoading || problems.length === 0}
            className="
              px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors duration-200
              flex items-center space-x-2
            "
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V6" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Success Messages */}
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

      {addSuccess && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Successfully added "{addSuccess}"!
              </p>
            </div>
          </div>
        </div>
      )}

      {exportSuccess && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Successfully exported {problems.length} problem{problems.length !== 1 ? 's' : ''} to CSV!
              </p>
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
        onDelete={handleDelete}
        isLoading={isLoading}
        expandedRowId={expandedRowId}
        onRowToggle={handleRowToggle}
      />

      {/* Add Problem Modal */}
      <AddProblemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreate}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProblem}
        problemName={deletingProblem?.name || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingProblem(null)}
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
