import type { EmbedOptions } from './types.js'

// Plain http is allowed only for a scan interface running on the developer's
// own machine. A localhost URL never leaves the visitor's computer, so this
// exception cannot expose a session token on the network.
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
