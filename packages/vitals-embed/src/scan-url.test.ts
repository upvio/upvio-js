import { describe, expect, it } from 'vitest'

import { parseScanUrl } from './scan-url.js'

import type { EmbedOptions } from './types.js'

const EMBED_URL = 'https://scan.upvio.com/acme/scans/scan_1/embed#token=tok_1'

const parse = (options: Partial<EmbedOptions> = {}) =>
  parseScanUrl({ url: EMBED_URL, container: '#scan', ...options })

describe('parseScanUrl', () => {
  it('returns the url unchanged without lang or themeMode', () => {
    expect(parse().href).toBe(EMBED_URL)
  })

  it('appends lang and themeMode while keeping the token hash', () => {
    const url = parse({ lang: 'es', themeMode: 'dark' })

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
