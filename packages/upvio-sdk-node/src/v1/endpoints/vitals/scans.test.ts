import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UpvioApiClient } from '../../../client'
import { UpvioApiRequestError } from '../../../errors'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockOk(data: unknown = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

function mockError(status: number, statusText: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
  })
}

function createClient(overrides?: { baseUrl?: string }) {
  return new UpvioApiClient({
    apiKey: 'test-api-key',
    businessId: 'biz_123',
    baseUrl: 'https://api.example.com',
    ...overrides,
  })
}

describe('UpvioApiClient', () => {
  it('defaults baseUrl to https://api.upvio.com', () => {
    const client = new UpvioApiClient({
      apiKey: 'key',
      businessId: 'biz',
    })
    expect(client.options.baseUrl).toBe('https://api.upvio.com')
  })

  it('uses a custom baseUrl when provided', () => {
    const client = new UpvioApiClient({
      apiKey: 'key',
      businessId: 'biz',
      baseUrl: 'https://custom.example.com',
    })
    expect(client.options.baseUrl).toBe('https://custom.example.com')
  })
})

describe('request layer', () => {
  it('sets the Authorization header from the apiKey', async () => {
    mockOk({ data: [] })
    const client = createClient()

    await client.v1.vitals.scans.list()

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer test-api-key')
  })

  it('throws UpvioApiRequestError on non-ok response', async () => {
    mockError(401, 'Unauthorized')
    const client = createClient()

    await expect(client.v1.vitals.scans.list()).rejects.toThrowError(
      UpvioApiRequestError,
    )
  })

  it('returns the raw JSON response from the server', async () => {
    const serverResponse = {
      data: { id: 'scan_1', status: 'completed' },
      meta: { totalCount: 42 },
      error: undefined,
    }
    mockOk(serverResponse)
    const client = createClient()

    const result = await client.v1.vitals.scans.list()

    expect(result).toStrictEqual(serverResponse)
  })

  it('includes status and statusText on the error', async () => {
    mockError(404, 'Not Found')
    const client = createClient()

    try {
      await client.v1.vitals.scans.retrieve('nonexistent')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(UpvioApiRequestError)
      expect((error as UpvioApiRequestError).status).toBe(404)
      expect((error as UpvioApiRequestError).statusText).toBe('Not Found')
    }
  })
})

describe('client.v1.vitals.scans', () => {
  describe('create', () => {
    it('sends a POST with the body JSON-serialized', async () => {
      mockOk({ data: { id: 'scan_123' } })
      const client = createClient()

      const body = {
        vitalsLinkId: 'link_456',
        patientId: 'patient_789',
        inputData: {
          height: 180,
          weight: 75,
        },
      }

      const result = await client.v1.vitals.scans.create(body)

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url, options] = mockFetch.mock.calls[0]

      expect(url).toBe(
        'https://api.example.com/v1/businesses/biz_123/vitals/scans',
      )
      expect(options.method).toBe('POST')
      expect(options.headers).toMatchObject({
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json',
      })
      expect(JSON.parse(options.body)).toEqual(body)
      expect(result).toEqual({ data: { id: 'scan_123' } })
    })
  })

  describe('list', () => {
    it('sends a GET to the scans endpoint', async () => {
      const responseData = { data: [{ id: 'scan_1' }], meta: { totalCount: 1 } }
      mockOk(responseData)
      const client = createClient()

      const result = await client.v1.vitals.scans.list()

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe(
        'https://api.example.com/v1/businesses/biz_123/vitals/scans',
      )
      expect(options.method).toBe('GET')
      expect(result).toEqual(responseData)
    })

    it('appends query params when provided', async () => {
      mockOk({ data: [] })
      const client = createClient()

      await client.v1.vitals.scans.list({ limit: 10, offset: 20 })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('limit=10')
      expect(url).toContain('offset=20')
    })

    it('omits undefined query params', async () => {
      mockOk({ data: [] })
      const client = createClient()

      await client.v1.vitals.scans.list({ limit: 5, offset: undefined })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('limit=5')
      expect(url).not.toContain('offset')
    })
  })

  describe('retrieve', () => {
    it('sends a GET to the scan by id', async () => {
      mockOk({ data: { id: 'scan_abc' } })
      const client = createClient()

      const result = await client.v1.vitals.scans.retrieve('scan_abc')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe(
        'https://api.example.com/v1/businesses/biz_123/vitals/scans/scan_abc',
      )
      expect(options.method).toBe('GET')
      expect(result).toEqual({ data: { id: 'scan_abc' } })
    })
  })
})
