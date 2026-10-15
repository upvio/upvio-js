# Upvio SDK Node

Communicate with the Upvio API from a Node.js environment.

## Installation

```bash
pnpm add @upvio/sdk-node
```

## Usage

```typescript
import { UpvioApiClient } from '@upvio/sdk-node'

const client = new UpvioApiClient({
  apiKey: process.env.UPVIO_API_KEY!,
  businessId: process.env.UPVIO_BUSINESS_ID!,
})

const patients = await client.v1.core.patients.list()
for (const patient of patients) {
  console.log(patient.email)
}
```

### Embedding the scan interface

Create an embed session for a pending or started scan on your backend and
load its `url` in an iframe on one of your allowed origins. The URL is valid
for one hour.

```typescript
const { data, error } = await client.v1.vitals.scans.createEmbedSession(scanId)
// data: { url, expiresAt }
```

Requires the `vitals.embed` feature and at least one allowed origin under
**Settings → Developers → Allowed Origins** in the Account Portal.
