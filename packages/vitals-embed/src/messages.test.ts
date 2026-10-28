import { describe, expect, it, vi } from 'vitest'

import { handleMessage, isFromScan, isScanMessage } from './messages.js'

const SCAN_ORIGIN = 'https://scan.upvio.com'
const EMBED_URL = `${SCAN_ORIGIN}/acme/scans/scan_1/embed#token=tok_1`

const status = (value: string) => ({
  type: 'SCAN_STATUS',
  payload: { scanId: 'scan_1', status: value },
})

const callbacks = () => ({
  onSucceeded: vi.fn(),
  onFailed: vi.fn(),
  onAborted: vi.fn(),
  onError: vi.fn(),
})

describe('isScanMessage', () => {
  it.each([
    ['a succeeded status', status('SUCCEEDED')],
    ['a failed status', status('FAILED')],
    ['an aborted status', status('ABORTED')],
    [
      'an error with a reason',
      { type: 'SCAN_ERROR', payload: { scanId: 'scan_1', reason: 'boom' } },
    ],
    [
      'an error without a reason',
      { type: 'SCAN_ERROR', payload: { scanId: 'a' } },
    ],
    [
      'a cancel request',
      { type: 'SCAN_CANCEL_REQUEST', payload: { scanId: 'a' } },
    ],
    [
      'an activity keep-alive',
      { type: 'SCAN_ACTIVITY', payload: { scanId: 'a' } },
    ],
  ])('accepts %s', (_, data) => {
    expect(isScanMessage(data)).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'SCAN_STATUS'],
    ['an unknown type', { type: 'SCAN_DONE', payload: { scanId: 'a' } }],
    [
      'an inherited property with a scanId',
      { type: 'constructor', payload: { scanId: 'a' } },
    ],
    ['a missing payload', { type: 'SCAN_STATUS' }],
    ['a missing scanId', { type: 'SCAN_STATUS', payload: {} }],
    ['a non-string scanId', { type: 'SCAN_ACTIVITY', payload: { scanId: 1 } }],
    ['a non-terminal status', status('STARTED')],
    [
      'a non-string reason',
      { type: 'SCAN_ERROR', payload: { scanId: 'scan_1', reason: 42 } },
    ],
  ])('rejects %s', (_, data) => {
    expect(isScanMessage(data)).toBe(false)
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
    ['SUCCEEDED', 'onSucceeded'],
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

  it('passes only the scan ID to onError when there is no reason', () => {
    const onError = vi.fn()

    handleMessage(
      { type: 'SCAN_ERROR', payload: { scanId: 'scan_1' } },
      { url: EMBED_URL, container: '#scan', onError },
      vi.fn(),
    )

    expect(onError.mock.calls).toStrictEqual([[{ scanId: 'scan_1' }]])
  })

  it('does not pass unknown payload fields to onError', () => {
    const onError = vi.fn()
    const payload = { scanId: 'scan_1', reason: 'boom', extra: 'x' }

    handleMessage(
      { type: 'SCAN_ERROR', payload },
      { url: EMBED_URL, container: '#scan', onError },
      vi.fn(),
    )

    expect(onError.mock.calls).toStrictEqual([
      [{ scanId: 'scan_1', reason: 'boom' }],
    ])
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
