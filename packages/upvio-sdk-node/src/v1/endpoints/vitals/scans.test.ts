import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UpvioApiClient } from '../../../client'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('client.v1.vitals.scans.create', () => {
  it('sends the correct request to the API', async () => {
    const responseData = { data: { id: 'scan_123' } }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    })

    const client = new UpvioApiClient({
      apiKey: 'test-api-key',
      businessId: 'biz_123',
      baseUrl: 'https://api.example.com',
    })

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
    expect(result).toEqual(responseData)
  })
})
