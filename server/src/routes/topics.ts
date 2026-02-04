/**
 * Topics API Routes
 *
 * Endpoints:
 * - GET    /api/topics     - List all topics (alphabetically)
 * - POST   /api/topics     - Create a new topic
 * - DELETE /api/topics/:id - Delete a topic (cascades to problem_topics)
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/index.js';
import type { Topic, NewTopic } from '../db/types.js';

export const topicsRouter = Router();

/**
 * Input validation constants
 */
const MAX_TOPIC_NAME_LENGTH = 100;

/**
 * GET /api/topics
 * List all topics ordered alphabetically by name
 *
 * @returns {Topic[]} Array of all topics
 */
topicsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM topics ORDER BY name ASC');
    const topics = stmt.all() as Topic[];

    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch topics',
    });
  }
});

/**
 * POST /api/topics
 * Create a new topic
 *
 * Request body:
 * {
 *   "name": "Topic Name"  // Required, max 100 chars, must be unique (case-insensitive)
 * }
 *
 * Validation:
 * - name is required
 * - name must be <= 100 characters
 * - name must be unique (case-insensitive)
 *
 * @returns {Topic} The created topic
 */
topicsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name } = req.body as NewTopic;

    // Validate required field
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Topic name is required and must be a string',
      });
      return;
    }

    // Trim whitespace
    const trimmedName = name.trim();

    // Validate name length
    if (trimmedName.length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Topic name cannot be empty',
      });
      return;
    }

    if (trimmedName.length > MAX_TOPIC_NAME_LENGTH) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Topic name must be ${MAX_TOPIC_NAME_LENGTH} characters or less`,
      });
      return;
    }

    const db = getDatabase();

    // Check for duplicate (case-insensitive)
    const existingTopic = db
      .prepare('SELECT id FROM topics WHERE LOWER(name) = LOWER(?)')
      .get(trimmedName) as { id: number } | undefined;

    if (existingTopic) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A topic with this name already exists',
      });
      return;
    }

    // Insert new topic
    const stmt = db.prepare(
      'INSERT INTO topics (name) VALUES (?) RETURNING *'
    );
    const newTopic = stmt.get(trimmedName) as Topic;

    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create topic',
    });
  }
});

/**
 * DELETE /api/topics/:id
 * Delete a topic
 *
 * Cascade behavior:
 * - Deletes all entries in problem_topics referencing this topic
 * - Does NOT delete problems (only the association)
 *
 * @param {number} id - Topic ID
 * @returns {object} Success message with deleted topic ID
 */
topicsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const topicId = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(topicId)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid topic ID',
      });
      return;
    }

    const db = getDatabase();

    // Check if topic exists
    const topic = db
      .prepare('SELECT id FROM topics WHERE id = ?')
      .get(topicId) as { id: number } | undefined;

    if (!topic) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Topic not found',
      });
      return;
    }

    // Delete topic (cascade to problem_topics is handled by foreign key)
    const stmt = db.prepare('DELETE FROM topics WHERE id = ?');
    stmt.run(topicId);

    res.status(200).json({
      message: 'Topic deleted successfully',
      id: topicId,
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete topic',
    });
  }
});
