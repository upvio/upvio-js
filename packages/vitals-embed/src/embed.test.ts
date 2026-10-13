import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { embed } from './embed'

import type { EmbeddedScan, EmbedOptions } from './embed'

const SCAN_ORIGIN = 'https://scan.upvio.com'
const EMBED_URL = `${SCAN_ORIGIN}/acme/scans/scan_1/embed#token=tok_1`

let container: HTMLDivElement
let scan: EmbeddedScan | undefined

beforeEach(() => {
  container = document.createElement('div')
  container.id = 'scan'
  document.body.appendChild(container)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  Reflect.deleteProperty(window, 'crossOriginIsolated')
  scan?.destroy()
  scan = undefined
  container.remove()
  vi.restoreAllMocks()
})

const embedScan = (options: Partial<EmbedOptions> = {}) => {
  scan = embed({ url: EMBED_URL, container: '#scan', ...options })
  return scan
}

const getIframe = () => {
  const iframe = container.querySelector('iframe')
  if (!iframe) throw new Error('expected an iframe in the container')
  return iframe
}

const postFromIframe = (
  data: unknown,
  overrides: { origin?: string; source?: Window | null } = {},
) => {
  window.dispatchEvent(
    new MessageEvent('message', {
      data,
      origin: overrides.origin ?? SCAN_ORIGIN,
      source:
        'source' in overrides ? overrides.source : getIframe().contentWindow,
    }),
  )
}

const setCrossOriginIsolated = (value: boolean) => {
  Object.defineProperty(window, 'crossOriginIsolated', {
    configurable: true,
    value,
  })
}

const status = (value: string) => ({
  type: 'SCAN_STATUS',
  payload: { scanId: 'scan_1', status: value },
})

const statusCallbacks = () => ({
  onCompleted: vi.fn(),
  onFailed: vi.fn(),
  onAborted: vi.fn(),
  onError: vi.fn(),
})

describe('embed', () => {
  describe('iframe', () => {
    it('appends an iframe with the scan URL and permissions', () => {
      embedScan()

      const iframe = getIframe()
      expect(iframe.src).toBe(EMBED_URL)
      expect(iframe.allow).toBe('camera; microphone; cross-origin-isolated')
      expect(iframe.title).toBe('Upvio vitals scan')
    })

    it('appends lang and theme while keeping the token hash', () => {
      embedScan({ lang: 'es', theme: 'dark' })

      const src = new URL(getIframe().src)
      expect(src.hash).toBe('#token=tok_1')
      expect(src.searchParams.get('lang')).toBe('es')
      expect(src.searchParams.get('theme')).toBe('dark')
    })

    it('accepts an element as the container', () => {
      embedScan({ container })

      expect(getIframe().parentElement).toBe(container)
    })
  })

  describe('validation', () => {
    it('throws when the container selector matches nothing', () => {
      expect(() => embedScan({ container: '#missing' })).toThrow(
        'no element matches the container selector "#missing"',
      )
    })

    it('throws when the url is not a valid URL', () => {
      expect(() => embedScan({ url: 'not a url' })).toThrow(
        '`url` is not a valid absolute URL',
      )
    })

    it('throws when the url is plain http on a public host', () => {
      expect(() =>
        embedScan({ url: 'http://scan.example.com/a/scans/1/embed' }),
      ).toThrow('must use https, got "http://scan.example.com"')
    })

    it.each([
      'http://localhost:3000/a/scans/1/embed',
      'http://127.0.0.1:3000/a/scans/1/embed',
    ])('allows http on a local host: %s', (url) => {
      embedScan({ url })

      expect(getIframe().src).toBe(url)
    })

    it('does not append an iframe when validation fails', () => {
      expect(() => embedScan({ url: 'http://example.com' })).toThrow()

      expect(container.querySelector('iframe')).toBeNull()
    })
  })

  describe('cross-origin isolation warning', () => {
    it('warns when the page is not cross-origin isolated', () => {
      setCrossOriginIsolated(false)

      embedScan()

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cross-Origin-Embedder-Policy: require-corp'),
      )
    })

    it('stays silent when the page is cross-origin isolated', () => {
      setCrossOriginIsolated(true)

      embedScan()

      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('scan events', () => {
    it.each([
      ['SUCCEEDED', 'onCompleted'],
      ['FAILED', 'onFailed'],
      ['ABORTED', 'onAborted'],
    ] as const)('calls only %s → %s', (value, callbackName) => {
      const callbacks = statusCallbacks()
      embedScan(callbacks)

      postFromIframe(status(value))

      for (const [name, callback] of Object.entries(callbacks)) {
        if (name === callbackName) {
          expect(callback).toHaveBeenCalledExactlyOnceWith({
            scanId: 'scan_1',
          })
        } else {
          expect(callback).not.toHaveBeenCalled()
        }
      }
    })

    it('passes the error reason to onError', () => {
      const onError = vi.fn()
      embedScan({ onError })

      postFromIframe({
        type: 'SCAN_ERROR',
        payload: { scanId: 'scan_1', reason: 'complete failed' },
      })

      expect(onError).toHaveBeenCalledExactlyOnceWith({
        scanId: 'scan_1',
        reason: 'complete failed',
      })
    })

    it('does not throw when no callback is registered', () => {
      embedScan()

      expect(() => postFromIframe(status('SUCCEEDED'))).not.toThrow()
    })

    it('ignores activity keep-alives', () => {
      const callbacks = statusCallbacks()
      embedScan(callbacks)

      postFromIframe({ type: 'SCAN_ACTIVITY', payload: { scanId: 'scan_1' } })

      for (const callback of Object.values(callbacks)) {
        expect(callback).not.toHaveBeenCalled()
      }
    })
  })

  describe('cancel requests', () => {
    it('confirms the cancel back to the iframe', () => {
      embedScan()
      const iframeWindow = getIframe().contentWindow
      if (!iframeWindow) throw new Error('expected an iframe window')
      const postMessage = vi.spyOn(iframeWindow, 'postMessage')

      postFromIframe({
        type: 'SCAN_CANCEL_REQUEST',
        payload: { scanId: 'scan_1' },
      })

      expect(postMessage).toHaveBeenCalledExactlyOnceWith(
        { type: 'SCAN_CANCEL_CONFIRM', payload: { scanId: 'scan_1' } },
        SCAN_ORIGIN,
      )
    })
  })

  describe('untrusted messages', () => {
    it('ignores messages from another origin', () => {
      const onCompleted = vi.fn()
      embedScan({ onCompleted })

      postFromIframe(status('SUCCEEDED'), { origin: 'https://evil.example' })

      expect(onCompleted).not.toHaveBeenCalled()
    })

    it('ignores messages from another window', () => {
      const onCompleted = vi.fn()
      embedScan({ onCompleted })

      postFromIframe(status('SUCCEEDED'), { source: window })

      expect(onCompleted).not.toHaveBeenCalled()
    })

    it('ignores sourceless messages after the host removes the iframe', () => {
      const onCompleted = vi.fn()
      embedScan({ onCompleted })

      getIframe().remove()
      postFromIframe(status('SUCCEEDED'), { source: null })

      expect(onCompleted).not.toHaveBeenCalled()
    })

    it.each([
      ['null', null],
      ['a string', 'SCAN_STATUS'],
      ['an unknown type', { type: 'SCAN_DONE', payload: { scanId: 'a' } }],
      ['a missing payload', { type: 'SCAN_STATUS' }],
      ['a missing scanId', { type: 'SCAN_STATUS', payload: {} }],
      ['an unknown status', status('STARTED')],
      [
        'a non-string reason',
        { type: 'SCAN_ERROR', payload: { scanId: 'scan_1', reason: 42 } },
      ],
    ])('ignores %s', (_, data) => {
      const callbacks = statusCallbacks()
      embedScan(callbacks)

      postFromIframe(data)

      for (const callback of Object.values(callbacks)) {
        expect(callback).not.toHaveBeenCalled()
      }
    })
  })

  describe('destroy', () => {
    it('removes the iframe', () => {
      embedScan().destroy()

      expect(container.querySelector('iframe')).toBeNull()
    })

    it('stops calling callbacks', () => {
      const onCompleted = vi.fn()
      const embedded = embedScan({ onCompleted })
      const iframeWindow = getIframe().contentWindow

      embedded.destroy()
      postFromIframe(status('SUCCEEDED'), { source: iframeWindow })

      expect(onCompleted).not.toHaveBeenCalled()
    })

    it('can be called more than once', () => {
      const embedded = embedScan()
      embedded.destroy()

      expect(() => embedded.destroy()).not.toThrow()
    })
  })
})
