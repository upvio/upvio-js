import { isScanMessage } from './messages'

import type {
  CancelConfirmMessage,
  ScanMessage,
  TerminalScanStatus,
} from './messages'

export type ScanEvent = { scanId: string }

export type ScanErrorEvent = { scanId: string; reason?: string }

export type EmbedOptions = {
  /** The `url` returned by `vitals.scans.createEmbedSession` */
  url: string
  /** CSS selector or element the scan iframe is appended to */
  container: string | HTMLElement
  lang?: string
  theme?: 'light' | 'dark' | 'system'
  onCompleted?: (event: ScanEvent) => void
  onFailed?: (event: ScanEvent) => void
  onAborted?: (event: ScanEvent) => void
  onError?: (event: ScanErrorEvent) => void
}

export type EmbeddedScan = {
  /** Remove the iframe and stop listening for scan events */
  destroy: () => void
}

const IFRAME_ALLOW = 'camera; microphone; cross-origin-isolated'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

const parseScanUrl = (options: EmbedOptions): URL => {
  let url: URL
  try {
    url = new URL(options.url)
  } catch (cause) {
    throw new Error(
      'UpvioVitals.embed: `url` is not a valid absolute URL. Pass the ' +
        '`url` returned by `vitals.scans.createEmbedSession`.',
      { cause },
    )
  }

  const isLocal = url.protocol === 'http:' && LOCAL_HOSTNAMES.has(url.hostname)
  if (url.protocol !== 'https:' && !isLocal) {
    throw new Error(
      `UpvioVitals.embed: \`url\` must use https, got "${url.origin}".`,
    )
  }

  if (options.lang) url.searchParams.set('lang', options.lang)
  if (options.theme) url.searchParams.set('theme', options.theme)
  return url
}

const resolveContainer = (container: string | HTMLElement): HTMLElement => {
  if (typeof container !== 'string') return container

  const element = document.querySelector<HTMLElement>(container)
  if (!element) {
    throw new Error(
      `UpvioVitals.embed: no element matches the container selector ` +
        `"${container}". Make sure it exists before calling embed().`,
    )
  }
  return element
}

const warnIfNotCrossOriginIsolated = () => {
  if (window.crossOriginIsolated) return

  console.warn(
    'UpvioVitals.embed: this page is not cross-origin isolated, so the scan ' +
      'cannot run. Serve it with the headers ' +
      '`Cross-Origin-Opener-Policy: same-origin` and ' +
      '`Cross-Origin-Embedder-Policy: require-corp`.',
  )
}

const createIframe = (url: URL): HTMLIFrameElement => {
  const iframe = document.createElement('iframe')
  iframe.src = url.href
  iframe.allow = IFRAME_ALLOW
  iframe.title = 'Upvio vitals scan'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  return iframe
}

const statusCallback = (
  options: EmbedOptions,
  status: TerminalScanStatus,
): ((event: ScanEvent) => void) | undefined => {
  switch (status) {
    case 'SUCCEEDED':
      return options.onCompleted
    case 'FAILED':
      return options.onFailed
    case 'ABORTED':
      return options.onAborted
  }
}

const handleMessage = (
  message: ScanMessage,
  options: EmbedOptions,
  reply: (message: CancelConfirmMessage) => void,
) => {
  const { scanId } = message.payload
  switch (message.type) {
    case 'SCAN_STATUS':
      statusCallback(options, message.payload.status)?.({ scanId })
      return
    case 'SCAN_ERROR':
      options.onError?.(message.payload)
      return
    case 'SCAN_CANCEL_REQUEST':
      reply({ type: 'SCAN_CANCEL_CONFIRM', payload: { scanId } })
      return
    case 'SCAN_ACTIVITY':
      return
  }
}

/**
 * Embed the Upvio vitals scan interface in an iframe inside `container`.
 * Callbacks are signals only: fetch scan results from your backend.
 */
export const embed = (options: EmbedOptions): EmbeddedScan => {
  const url = parseScanUrl(options)
  const container = resolveContainer(options.container)
  warnIfNotCrossOriginIsolated()

  const iframe = createIframe(url)
  const reply = (message: CancelConfirmMessage) =>
    iframe.contentWindow?.postMessage(message, url.origin)

  const onMessage = (event: MessageEvent) => {
    if (!event.source || event.source !== iframe.contentWindow) return
    if (event.origin !== url.origin) return
    if (!isScanMessage(event.data)) return
    handleMessage(event.data, options, reply)
  }

  window.addEventListener('message', onMessage)
  container.appendChild(iframe)

  return {
    destroy: () => {
      window.removeEventListener('message', onMessage)
      iframe.remove()
    },
  }
}
