import { describe, expect, it } from 'vitest'

import { isScanMessage } from './messages'

const status = (value: string) => ({
  type: 'SCAN_STATUS',
  payload: { scanId: 'scan_1', status: value },
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
