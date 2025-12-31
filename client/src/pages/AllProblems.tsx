/**
 * All Problems page - CSV import and problem management
 */

import { useState } from 'react';
import { ImportModal } from '../components/ImportModal';

export function AllProblems() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImportSuccess = (result: { imported: number; skipped: number }) => {
    setImportSuccess(result);
    // Clear success message after 5 seconds
    setTimeout(() => setImportSuccess(null), 5000);
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

      {/* MVP Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              MVP Version
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                This is the initial version focused on CSV import functionality.
                The problem table view with filtering and sorting will be added in a future update.
              </p>
              <div className="mt-4">
                <p className="font-medium mb-1">To get started:</p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Click "Import CSV" above to upload your LeetCode problems</li>
                  <li>Use the provided CSV format template</li>
                  <li>After import, visit the Dashboard to start your daily practice</li>
                </ol>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                <p className="font-medium text-blue-900 mb-1">Quick CSV Template:</p>
                <div className="font-mono text-xs text-blue-800">
                  Problem,Link,Color,LastReviewed,KeyInsight<br />
                  Two Sum,https://leetcode.com/problems/two-sum/,gray,,Hash map for O(n)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
