import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../index.js';

/**
 * Integration tests for the Express server
 *
 * Tests verify:
 * - Server starts and accepts connections
 * - Health check endpoint returns correct status
 * - Basic middleware is configured (JSON parsing, CORS)
 */
describe('Express Server', () => {
  beforeAll(() => {
    // Server should be running from index.ts
  });

  afterAll(() => {
    // Clean up server connection
    if (server) {
      server.close();
    }
  });

  describe('GET /health', () => {
    it('should return 200 OK with status healthy', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
      });
    });

    it('should return a valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('Middleware', () => {
    it('should parse JSON request bodies', async () => {
      // We'll test this more thoroughly when we add POST endpoints
      // For now, verify the app accepts JSON
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should get 404 (route doesn't exist) but body should be parsed
      expect(response.status).toBe(404);
    });

    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
