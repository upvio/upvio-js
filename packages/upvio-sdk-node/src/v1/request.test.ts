import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { request } from './request'

import type { UpvioApiClient } from '../client'

const mockFetch = vi.fn()

const client = {
  options: {
    apiKey: 'test-key',
    businessId: 'biz_1',
    baseUrl: 'https://api.example.com',
  },
} as UpvioApiClient

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('request', () => {
  describe('response parsing', () => {
    it('returns the parsed JSON body as-is', async () => {
      const body = { data: { id: '1', name: 'Test' }, meta: { totalCount: 1 } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(body),
      })

      const result = await request('/test', { method: 'GET' }, client)

      expect(result).toStrictEqual(body)
    })

    it('returns an error payload from the server without throwing', async () => {
      const body = {
        error: { message: 'Patient not found', code: 'not_found' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(body),
      })

      const result = await request('/test', { method: 'GET' }, client)

      expect(result).toStrictEqual(body)
      expect(result.error).toEqual({
        message: 'Patient not found',
        code: 'not_found',
      })
      expect(result.data).toBeUndefined()
    })

    it('returns an empty object when the server responds with one', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      const result = await request('/test', { method: 'POST' }, client)

      expect(result).toStrictEqual({})
      expect(result.data).toBeUndefined()
      expect(result.meta).toBeUndefined()
    })

    it('propagates the rejection when the server returns malformed JSON', async () => {
      const jsonError = new SyntaxError('Unexpected token')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(jsonError),
      })

      await expect(request('/test', { method: 'GET' }, client)).rejects.toThrow(
        jsonError,
      )
    })
  })

  describe('error handling', () => {
    it('returns parsed JSON for 4xx responses', async () => {
      const body = {
        error: { message: 'Bad request', code: 'bad_request' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(body),
      })

      const result = await request('/test', { method: 'POST' }, client)

      expect(result).toStrictEqual(body)
    })

    it('returns parsed JSON for 5xx responses', async () => {
      const body = {
        error: { message: 'Internal server error', code: 'internal' },
      }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve(body),
      })

      const result = await request('/test', { method: 'GET' }, client)

      expect(result).toStrictEqual(body)
    })

    it('propagates network errors from fetch', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))

      await expect(request('/test', { method: 'GET' }, client)).rejects.toThrow(
        TypeError,
      )
    })
  })

  describe('URL construction', () => {
    it('builds the URL from client options and path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request('/vitals/scans', { method: 'GET' }, client)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe(
        'https://api.example.com/v1/businesses/biz_1/vitals/scans',
      )
    })

    it('appends query params to the URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request('/items', { method: 'GET' }, client, {
        limit: 10,
        page: 2,
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('?')
      expect(url).toContain('limit=10')
      expect(url).toContain('page=2')
    })

    it('omits undefined params from the query string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request('/items', { method: 'GET' }, client, {
        limit: 5,
        cursor: undefined,
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('limit=5')
      expect(url).not.toContain('cursor')
    })

    it('omits the query string entirely when no params are provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request('/items', { method: 'GET' }, client)

      const [url] = mockFetch.mock.calls[0]
      expect(url).not.toContain('?')
    })
  })

  describe('headers', () => {
    it('sets Authorization and Content-Type headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await request('/test', { method: 'GET' }, client)

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers).toMatchObject({
        Authorization: 'Bearer test-key',
        'Content-Type': 'application/json',
      })
    })

    it('passes through the request method and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      const body = JSON.stringify({ name: 'test' })
      await request('/test', { method: 'POST', body }, client)

      const [, options] = mockFetch.mock.calls[0]
      expect(options.method).toBe('POST')
      expect(options.body).toBe(body)
    })
  })
})
