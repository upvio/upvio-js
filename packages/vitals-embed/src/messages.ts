import type { EmbedOptions, ScanEvent } from './types.js'

const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'ABORTED'] as const

export type TerminalScanStatus = (typeof TERMINAL_STATUSES)[number]

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

type UnvalidatedMessage = { type?: unknown; payload?: unknown }

type UnvalidatedPayload = {
  scanId?: unknown
  status?: unknown
  reason?: unknown
}

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null

const isTerminalStatus = (value: unknown): value is TerminalScanStatus =>
  TERMINAL_STATUSES.some((status) => status === value)

const PAYLOAD_VALIDATORS: Record<
  ScanMessage['type'],
  (payload: UnvalidatedPayload) => boolean
> = {
  SCAN_STATUS: ({ status }) => isTerminalStatus(status),
  SCAN_ERROR: ({ reason }) =>
    reason === undefined || typeof reason === 'string',
  SCAN_CANCEL_REQUEST: () => true,
  SCAN_ACTIVITY: () => true,
}

const isMessageType = (value: unknown): value is ScanMessage['type'] =>
  typeof value === 'string' && Object.hasOwn(PAYLOAD_VALIDATORS, value)

export const isScanMessage = (data: unknown): data is ScanMessage => {
  if (!isObject(data)) return false

  const { type, payload } = data as UnvalidatedMessage
  if (!isMessageType(type) || !isObject(payload)) return false

  const fields = payload as UnvalidatedPayload
  return typeof fields.scanId === 'string' && PAYLOAD_VALIDATORS[type](fields)
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
