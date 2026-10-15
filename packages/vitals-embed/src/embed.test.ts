import { describe, expect, it, vi } from 'vitest'

import { handleMessage, isFromScan, parseScanUrl } from './embed'

import type { EmbedOptions } from './embed'

const SCAN_ORIGIN = 'https://scan.upvio.com'
const EMBED_URL = `${SCAN_ORIGIN}/acme/scans/scan_1/embed#token=tok_1`

const parse = (options: Partial<EmbedOptions> = {}) =>
  parseScanUrl({ url: EMBED_URL, container: '#scan', ...options })

const callbacks = () => ({
  onCompleted: vi.fn(),
  onFailed: vi.fn(),
  onAborted: vi.fn(),
  onError: vi.fn(),
})

describe('parseScanUrl', () => {
  it('returns the url unchanged without lang or theme', () => {
    expect(parse().href).toBe(EMBED_URL)
  })

  it('appends lang and theme while keeping the token hash', () => {
    const url = parse({ lang: 'es', theme: 'dark' })

    expect(url.hash).toBe('#token=tok_1')
    expect(url.searchParams.get('lang')).toBe('es')
    expect(url.searchParams.get('theme')).toBe('dark')
  })

  it('throws when the url is not a valid URL', () => {
    expect(() => parse({ url: 'not a url' })).toThrow(
      '`url` is not a valid absolute URL',
    )
  })

  it.each([
    'http://scan.example.com/a/scans/1/embed',
    'ftp://scan.example.com/a/scans/1/embed',
  ])('throws when the url is not https on a public host: %s', (url) => {
    expect(() => parse({ url })).toThrow('must use https')
  })

  it.each([
    'http://localhost:3000/a/scans/1/embed',
    'http://127.0.0.1:3000/a/scans/1/embed',
  ])('allows http on a local host: %s', (url) => {
    expect(parse({ url }).href).toBe(url)
  })
})

describe('isFromScan', () => {
  const scanWindow = {}

  it('accepts a message from the scan window and origin', () => {
    const event = { source: scanWindow, origin: SCAN_ORIGIN }

    expect(isFromScan(event, scanWindow, SCAN_ORIGIN)).toBe(true)
  })

  it('rejects a message from another origin', () => {
    const event = { source: scanWindow, origin: 'https://evil.example' }

    expect(isFromScan(event, scanWindow, SCAN_ORIGIN)).toBe(false)
  })

  it('rejects a message from another window', () => {
    const event = { source: {}, origin: SCAN_ORIGIN }

    expect(isFromScan(event, scanWindow, SCAN_ORIGIN)).toBe(false)
  })

  it('rejects a sourceless message once the iframe window is gone', () => {
    const event = { source: null, origin: SCAN_ORIGIN }

    expect(isFromScan(event, null, SCAN_ORIGIN)).toBe(false)
  })
})

describe('handleMessage', () => {
  it.each([
    ['SUCCEEDED', 'onCompleted'],
    ['FAILED', 'onFailed'],
    ['ABORTED', 'onAborted'],
  ] as const)('routes %s only to %s', (status, callbackName) => {
    const all = callbacks()

    handleMessage(
      { type: 'SCAN_STATUS', payload: { scanId: 'scan_1', status } },
      { url: EMBED_URL, container: '#scan', ...all },
      vi.fn(),
    )

    for (const [name, callback] of Object.entries(all)) {
      if (name === callbackName) {
        expect(callback).toHaveBeenCalledExactlyOnceWith({ scanId: 'scan_1' })
      } else {
        expect(callback).not.toHaveBeenCalled()
      }
    }
  })

  it('passes the error reason to onError', () => {
    const options = { url: EMBED_URL, container: '#scan', ...callbacks() }

    handleMessage(
      { type: 'SCAN_ERROR', payload: { scanId: 'scan_1', reason: 'boom' } },
      options,
      vi.fn(),
    )

    expect(options.onError).toHaveBeenCalledExactlyOnceWith({
      scanId: 'scan_1',
      reason: 'boom',
    })
  })

  it('confirms a cancel request', () => {
    const reply = vi.fn()

    handleMessage(
      { type: 'SCAN_CANCEL_REQUEST', payload: { scanId: 'scan_1' } },
      { url: EMBED_URL, container: '#scan' },
      reply,
    )

    expect(reply).toHaveBeenCalledExactlyOnceWith({
      type: 'SCAN_CANCEL_CONFIRM',
      payload: { scanId: 'scan_1' },
    })
  })
})
