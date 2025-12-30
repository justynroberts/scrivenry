/**
 * Health API Tests
 *
 * Note: These tests mock the database module to test the health endpoint
 * in isolation without requiring a real database connection.
 */

// Mock the database module
jest.mock('@/lib/db', () => ({
  db: {
    get: jest.fn(),
  },
}))

import { GET } from '@/app/api/health/route'
import { db } from '@/lib/db'

const mockDb = db as jest.Mocked<typeof db>

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when database is healthy', () => {
    it('should return healthy status', async () => {
      mockDb.get.mockResolvedValueOnce({ ok: 1 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.database).toBe('connected')
    })

    it('should include version', async () => {
      mockDb.get.mockResolvedValueOnce({ ok: 1 })

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('version')
    })

    it('should include timestamp', async () => {
      mockDb.get.mockResolvedValueOnce({ ok: 1 })

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('timestamp')
      expect(new Date(data.timestamp).getTime()).not.toBeNaN()
    })
  })

  describe('when database returns unexpected result', () => {
    it('should return unhealthy status when ok is not 1', async () => {
      mockDb.get.mockResolvedValueOnce({ ok: 0 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.database).toBe('disconnected')
    })

    it('should return unhealthy status when result is null', async () => {
      mockDb.get.mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
    })

    it('should return unhealthy status when result is undefined', async () => {
      mockDb.get.mockResolvedValueOnce(undefined)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
    })
  })

  describe('when database throws error', () => {
    it('should return unhealthy status', async () => {
      mockDb.get.mockRejectedValueOnce(new Error('Connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.database).toBe('error')
    })

    it('should include error message', async () => {
      mockDb.get.mockRejectedValueOnce(new Error('Connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(data.error).toBe('Connection failed')
    })

    it('should handle non-Error throws', async () => {
      mockDb.get.mockRejectedValueOnce('String error')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Unknown error')
    })

    it('should include timestamp even on error', async () => {
      mockDb.get.mockRejectedValueOnce(new Error('Connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('response format', () => {
    it('should return JSON content type', async () => {
      mockDb.get.mockResolvedValueOnce({ ok: 1 })

      const response = await GET()

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})
