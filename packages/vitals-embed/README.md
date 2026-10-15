# Upvio Vitals Embed

Embed the Upvio vitals scan interface in your web page.

## Installation

```bash
pnpm add @upvio/vitals-embed
```

## How it works

1. **Backend:** create a scan and an embed session with
   [`@upvio/sdk-node`](https://www.npmjs.com/package/@upvio/sdk-node). Send
   the session `url` to the browser. Never expose your API key to the browser.
   The URL is valid for one hour, so create a new session each time you render
   the page.

   ```typescript
   const { data: scan } = await client.v1.vitals.scans.create({
     vitalsLinkId,
     patientId,
   })
   const { data: session } = await client.v1.vitals.scans.createEmbedSession(
     scan!.id,
   )
   // return session.url to the browser
   ```

2. **Browser:** embed the scan.

   ```typescript
   import * as UpvioVitals from '@upvio/vitals-embed'

   const scan = UpvioVitals.embed({
     url: sessionUrl,
     container: '#scan',
     onCompleted: ({ scanId }) => showResults(scanId),
     onFailed: ({ scanId }) => showRetry(scanId),
     onAborted: ({ scanId }) => scan.destroy(),
     onError: ({ scanId, reason }) => console.error(scanId, reason),
   })

   // Later:
   scan.destroy()
   ```

3. **Backend:** fetch the results with `client.v1.vitals.scans.retrieve(scanId)`.
   Callbacks are signals only and carry no results.

## Options

| option        | description                                                  |
| ------------- | ------------------------------------------------------------ |
| `url`         | The `url` returned by `vitals.scans.createEmbedSession`      |
| `container`   | CSS selector or element the iframe is appended to            |
| `lang`        | Interface language, e.g. `en`                                |
| `theme`       | `light`, `dark` or `system`                                  |
| `onCompleted` | The scan succeeded                                           |
| `onFailed`    | The scan failed                                              |
| `onAborted`   | The patient cancelled the scan                               |
| `onError`     | The scan finished but could not be saved. Includes `reason`  |

The iframe fills its container, so give the container a size. The iframe is
blank once the scan has finished: call `destroy()` and show your own UI.

## Host page requirements

### Allowed origins

Add your site's origin (e.g. `https://clinic.example.com`) in the Account
Portal under **Settings → Developers → Allowed Origins**. The scan interface
refuses to load in an iframe on any other origin. For local development,
add `http://localhost:<port>`.

### Cross-origin isolation

The scan needs `SharedArrayBuffer`, so the page that embeds it must be
cross-origin isolated. Serve it with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Next.js (`next.config.ts`):

```typescript
export default {
  async headers() {
    return [
      {
        source: '/scan',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}
```

Express:

```typescript
app.get('/scan', (req, res) => {
  res.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.set('Cross-Origin-Embedder-Policy', 'require-corp')
  res.sendFile('scan.html', { root: 'public' })
})
```

`embed()` logs a warning when the page is not cross-origin isolated.

### Referrer policy

Do not serve the page with `Referrer-Policy: no-referrer`. The scan interface
uses the referrer to know which origin to send events to, so no callbacks
fire without it. The browser default works.
