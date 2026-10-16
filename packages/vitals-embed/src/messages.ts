import type { EmbedOptions, ScanEvent } from './types.js'

export type TerminalScanStatus = 'SUCCEEDED' | 'FAILED' | 'ABORTED'

export type ScanMessage =
  | {
      type: 'SCAN_STATUS'
      payload: { scanId: string; status: TerminalScanStatus }
    }
  | { type: 'SCAN_ERROR'; payload: { scanId: string; reason?: string } }
  | { type: 'SCAN_CANCEL_REQUEST'; payload: { scanId: string } }
  | { type: 'SCAN_ACTIVITY'; payload: { scanId: string } }

export type CancelConfirmMessage = {
  type: 'SCAN_CANCEL_CONFIRM'
  payload: { scanId: string }
}

const MESSAGE_TYPES: ReadonlySet<string> = new Set([
  'SCAN_STATUS',
  'SCAN_ERROR',
  'SCAN_CANCEL_REQUEST',
  'SCAN_ACTIVITY',
])

const TERMINAL_STATUSES: ReadonlySet<unknown> = new Set([
  'SUCCEEDED',
  'FAILED',
  'ABORTED',
])

type UnvalidatedMessage = { type?: unknown; payload?: unknown }

type UnvalidatedPayload = {
  scanId?: unknown
  status?: unknown
  reason?: unknown
}

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null

export const isScanMessage = (data: unknown): data is ScanMessage => {
  if (!isObject(data)) return false

  const { type, payload } = data as UnvalidatedMessage
  if (typeof type !== 'string' || !MESSAGE_TYPES.has(type)) return false
  if (!isObject(payload)) return false

  const { scanId, status, reason } = payload as UnvalidatedPayload
  if (typeof scanId !== 'string') return false

  switch (type) {
    case 'SCAN_STATUS':
      return TERMINAL_STATUSES.has(status)
    case 'SCAN_ERROR':
      return reason === undefined || typeof reason === 'string'
    default:
      return true
  }
}

const statusCallback = (
  options: EmbedOptions,
  status: TerminalScanStatus,
): ((event: ScanEvent) => void) | undefined => {
  switch (status) {
    case 'SUCCEEDED':
      return options.onSucceeded
    case 'FAILED':
      return options.onFailed
    case 'ABORTED':
      return options.onAborted
  }
}

export const isFromScan = (
  event: { source: unknown; origin: string },
  scanWindow: unknown,
  scanOrigin: string,
): boolean => {
  if (!event.source) return false
  return event.source === scanWindow && event.origin === scanOrigin
}

export const handleMessage = (
  message: ScanMessage,
  options: EmbedOptions,
  reply: (message: CancelConfirmMessage) => void,
) => {
  const { scanId } = message.payload
  switch (message.type) {
    case 'SCAN_STATUS':
      statusCallback(options, message.payload.status)?.({ scanId })
      return
    case 'SCAN_ERROR': {
      const { reason } = message.payload
      options.onError?.(reason === undefined ? { scanId } : { scanId, reason })
      return
    }
    case 'SCAN_CANCEL_REQUEST':
      reply({ type: 'SCAN_CANCEL_CONFIRM', payload: { scanId } })
      return
    case 'SCAN_ACTIVITY':
      return
  }
}
