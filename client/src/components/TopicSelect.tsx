import { useState, useEffect, useRef } from 'react';
import { topicsApi } from '../api/client';
import type { Topic } from '../api/types';

interface TopicSelectProps {
  selectedTopicIds: number[];
  onChange: (topicIds: number[]) => void;
  disabled?: boolean;
}

export function TopicSelect({
  selectedTopicIds,
  onChange,
  disabled = false,
}: TopicSelectProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingNew(false);
        setNewTopicName('');
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function loadTopics() {
    try {
      const fetchedTopics = await topicsApi.getAll();
      setTopics(fetchedTopics);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setError('Failed to load topics');
    }
  }

  async function handleCreateTopic() {
    if (!newTopicName.trim()) return;

    try {
      const newTopic = await topicsApi.create(newTopicName.trim());
      setTopics([...topics, newTopic].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedTopicIds, newTopic.id]);
      setIsCreatingNew(false);
      setNewTopicName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    }
  }

  function toggleTopic(topicId: number) {
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter(id => id !== topicId));
    } else {
      onChange([...selectedTopicIds, topicId]);
    }
  }

  function removeTopic(topicId: number) {
    onChange(selectedTopicIds.filter(id => id !== topicId));
  }

  // Filter topics by search term
  const filteredTopics = searchTerm
    ? topics.filter(topic =>
        topic.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topics;

  // Get selected topic objects
  const selectedTopics = topics.filter(t => selectedTopicIds.includes(t.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected topics badges */}
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTopics.map(topic => (
            <span
              key={topic.id}
              className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800"
            >
              {topic.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTopic(topic.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="text-gray-700">
          {selectedTopics.length === 0 ? 'Select topics...' : 'Add more topics...'}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search topics..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}

          {/* Topics list */}
          <div className="py-1">
            {filteredTopics.map(topic => (
              <label
                key={topic.id}
                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{topic.name}</span>
              </label>
            ))}

            {filteredTopics.length === 0 && !isCreatingNew && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No topics found
              </div>
            )}
          </div>

          {/* Create new topic section */}
          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200"
            >
              + Add New Topic
            </button>
          ) : (
            <div className="p-2 border-t border-gray-200">
              <input
                type="text"
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTopic();
                  } else if (e.key === 'Escape') {
                    setIsCreatingNew(false);
                    setNewTopicName('');
                  }
                }}
                placeholder="New topic name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateTopic}
                  disabled={!newTopicName.trim()}
                  className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewTopicName('');
                  }}
                  className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
