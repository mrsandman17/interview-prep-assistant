/**
 * ImportModal - CSV import interface with file upload and result feedback
 */

import { useState, useRef, ChangeEvent } from 'react';
import { problemsApi } from '../api/client';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: { imported: number; skipped: number }) => void;
}

type ImportState = 'idle' | 'uploading' | 'success' | 'error';

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<ImportState>('idle');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset state when new file is selected
      setState('idle');
      setResult(null);
      setErrorMessage('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState('uploading');
    setErrorMessage('');

    try {
      // Read file contents
      const csvContent = await readFileAsText(selectedFile);

      // Call API
      const response = await problemsApi.importCSV(csvContent);

      setState('success');
      setResult(response);

      // Notify parent component
      onSuccess?.(response);
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to import CSV. Please check the file format and try again.'
      );
    }
  };

  const handleClose = () => {
    // Reset all state when closing
    setSelectedFile(null);
    setState('idle');
    setResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Import Problems from CSV
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Expected CSV Format</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Your CSV file should have the following columns:</p>
              <div className="bg-white rounded border border-blue-200 p-3 font-mono text-xs overflow-x-auto">
                Problem,Link,Color,LastReviewed,KeyInsight<br />
                Two Sum,https://leetcode.com/problems/two-sum/,gray,,Use hash map<br />
                Add Two Numbers,https://leetcode.com/problems/add-two-numbers/,orange,2024-01-15,Track carry
              </div>
              <div className="mt-2">
                <p className="font-medium">Required fields:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Problem (name)</li>
                  <li>Link (LeetCode URL)</li>
                </ul>
                <p className="font-medium mt-2">Optional fields:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Color (gray/orange/yellow/green)</li>
                  <li>LastReviewed (YYYY-MM-DD)</li>
                  <li>KeyInsight (your notes)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={state === 'uploading'}
              />
              <button
                onClick={handleChooseFile}
                disabled={state === 'uploading'}
                className="
                  px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                Choose File
              </button>
              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
            </div>
          </div>

          {/* Success Message */}
          {state === 'success' && result && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Import successful!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Imported {result.imported} problem{result.imported !== 1 ? 's' : ''}
                    {result.skipped > 0 && `, skipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Go to the Dashboard to start practicing!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {state === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Import failed</p>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            className="
              px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              transition-colors duration-200
            "
          >
            {state === 'success' ? 'Done' : 'Cancel'}
          </button>
          {state !== 'success' && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || state === 'uploading'}
              className="
                px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {state === 'uploading' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to read file contents as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
