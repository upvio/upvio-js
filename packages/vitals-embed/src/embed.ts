import { handleMessage, isFromScan, isScanMessage } from './messages.js'
import { parseScanUrl } from './scan-url.js'

import type { CancelConfirmMessage } from './messages.js'
import type { EmbeddedScan, EmbedOptions } from './types.js'

// camera: the scan measures vital signs from video of the patient's face.
// cross-origin-isolated: the scan needs SharedArrayBuffer.
const IFRAME_ALLOW = 'camera; cross-origin-isolated'

// The scan interface learns which origin to send events to from the referrer.
// Setting it on the iframe overrides a host page policy such as no-referrer
// or same-origin, which would otherwise leave every callback silent.
const IFRAME_REFERRER_POLICY = 'strict-origin'

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
  iframe.referrerPolicy = IFRAME_REFERRER_POLICY
  iframe.src = url.href
  iframe.allow = IFRAME_ALLOW
  iframe.title = 'Upvio vitals scan'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  return iframe
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
 *   when it is not.
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
