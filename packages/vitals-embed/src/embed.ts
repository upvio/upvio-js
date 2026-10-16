import { isScanMessage } from './messages.js'

import type {
  CancelConfirmMessage,
  ScanMessage,
  TerminalScanStatus,
} from './messages.js'

/** Identifies the scan a callback refers to. */
export type ScanEvent = {
  /** Fetch the scan's results with this ID from your backend. */
  scanId: string
}

/** Passed to `onError` when a finished scan could not be saved. */
export type ScanErrorEvent = {
  scanId: string
  /** Why the scan could not be saved, when the scan interface reports it. */
  reason?: string
}

/**
 * Options for {@link embed}.
 *
 * Callbacks are signals only and carry no scan results. Fetch the results
 * from your backend with `client.v1.vitals.scans.retrieve(scanId)`.
 */
export type EmbedOptions = {
  /**
   * The `url` returned by `client.v1.vitals.scans.createEmbedSession` in
   * `@upvio/sdk-node`. Create it on your backend so your API key never
   * reaches the browser. It is valid for one hour, so create a new session
   * each time you render the page.
   */
  url: string
  /**
   * The element the scan iframe is appended to, or a CSS selector for it.
   * It must exist when `embed()` is called. The iframe fills it, so give
   * the container a size.
   */
  container: string | HTMLElement
  /** Language of the scan interface. */
  lang?: 'en' | 'es'
  /** Color scheme of the scan interface. */
  themeMode?: 'light' | 'dark' | 'system'
  /** Called when the scan succeeds. */
  onSucceeded?: (event: ScanEvent) => void
  /** Called when the scan fails. */
  onFailed?: (event: ScanEvent) => void
  /** Called when the patient cancels the scan. */
  onAborted?: (event: ScanEvent) => void
  /** Called when the scan finishes but its results could not be saved. */
  onError?: (event: ScanErrorEvent) => void
}

/** A scan embedded with {@link embed}. */
export type EmbeddedScan = {
  /**
   * Remove the iframe and stop calling the callbacks. The iframe is blank
   * once the scan has finished, so call this from your callbacks and show
   * your own UI. Calling it more than once is safe.
   */
  destroy: () => void
}

const IFRAME_ALLOW = 'camera; microphone; cross-origin-isolated'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

export const parseScanUrl = (options: EmbedOptions): URL => {
  let url: URL
  try {
    url = new URL(options.url)
  } catch (cause) {
    throw new Error(
      '@upvio/vitals-embed: `url` is not a valid absolute URL. Pass the ' +
        '`url` returned by `vitals.scans.createEmbedSession`.',
      { cause },
    )
  }

  const isLocal = url.protocol === 'http:' && LOCAL_HOSTNAMES.has(url.hostname)
  if (url.protocol !== 'https:' && !isLocal) {
    throw new Error(
      `@upvio/vitals-embed: \`url\` must use https, got "${url.origin}".`,
    )
  }

  if (options.lang) url.searchParams.set('lang', options.lang)
  if (options.themeMode) {
    url.searchParams.set('theme', options.themeMode)
  }
  return url
}

const resolveContainer = (container: string | HTMLElement): HTMLElement => {
  if (typeof container !== 'string') return container

  const element = document.querySelector<HTMLElement>(container)
  if (!element) {
    throw new Error(
      `@upvio/vitals-embed: no element matches the container selector ` +
        `"${container}". Make sure it exists before calling embed().`,
    )
  }
  return element
}

const warnIfNotCrossOriginIsolated = () => {
  if (window.crossOriginIsolated) return

  console.warn(
    '@upvio/vitals-embed: this page is not cross-origin isolated, so the ' +
      'scan cannot run. Serve it with the headers ' +
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

/**
 * Embed the Upvio vitals scan interface in an iframe inside `container`.
 *
 * The host page must:
 * - be on an origin listed under Settings → Developers → Allowed Origins in
 *   the Account Portal, or the scan interface refuses to load;
 * - be cross-origin isolated, served with
 *   `Cross-Origin-Opener-Policy: same-origin` and
 *   `Cross-Origin-Embedder-Policy: require-corp`. `embed()` logs a warning
 *   when it is not;
 * - not use `Referrer-Policy: no-referrer`, or no callbacks are called.
 *
 * @throws When `url` is not a valid https URL, or `container` is a selector
 * that matches no element. No iframe is added in either case.
 *
 * @example
 * const scan = embed({
 *   url: sessionUrl,
 *   container: '#scan',
 *   onSucceeded: ({ scanId }) => showResults(scanId),
 *   onAborted: () => scan.destroy(),
 * })
 */
export const embed = (options: EmbedOptions): EmbeddedScan => {
  const url = parseScanUrl(options)
  const container = resolveContainer(options.container)
  warnIfNotCrossOriginIsolated()

  const iframe = createIframe(url)
  const reply = (message: CancelConfirmMessage) =>
    iframe.contentWindow?.postMessage(message, url.origin)

  const onMessage = (event: MessageEvent) => {
    if (!isFromScan(event, iframe.contentWindow, url.origin)) return
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
