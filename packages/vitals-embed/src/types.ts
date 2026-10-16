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
 * Options for `embed()`.
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

/** A scan embedded with `embed()`. */
export type EmbeddedScan = {
  /**
   * Remove the iframe and stop calling the callbacks. The iframe is blank
   * once the scan has finished, so call this from your callbacks and show
   * your own UI. Calling it more than once is safe.
   */
  destroy: () => void
}
