import type { UpvioApiClient } from '../client'

export type ResponseData<
  T extends {
    responses: {
      '200': { content: { 'application/json': { data?: unknown } } }
    }
  },
> = T['responses']['200']['content']['application/json']['data']

export type QueryParams<
  T extends {
    parameters: {
      query?: Record<string, unknown>
    }
  },
> = NonNullable<T['parameters']['query']>

export type CreatedResponseData<
  T extends {
    responses: {
      '201': { content: { 'application/json': { data?: unknown } } }
    }
  },
> = T['responses']['201']['content']['application/json']['data']

export type RequestBody<
  T extends {
    requestBody: {
      content: { 'application/json': unknown }
    }
  },
> = T['requestBody']['content']['application/json']

export type ApiV1Response<T> = {
  data?: T
  meta?: {
    totalCount?: number
  }
  error?: {
    title: string
    code: string
  }
}

/**
 * Make a raw request to the Upvio API within a business context.
 * Used internally by client helper methods but can also be used directly for custom API calls that are not yet supported by the client.
 */
export const request = async <T>(
  path: string,
  options?: RequestInit,
  client?: UpvioApiClient,
  params?: Record<string, string | number | undefined>,
): Promise<ApiV1Response<T>> => {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    }
  }
  const queryString = searchParams.toString()
  const url = `${client?.options.baseUrl}/v1/businesses/${client?.options.businessId}${path}${queryString ? `?${queryString}` : ''}`
  const headers = {
    Authorization: `Bearer ${client?.options.apiKey}`,
    'Content-Type': 'application/json',
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })

  return response.json()
}
