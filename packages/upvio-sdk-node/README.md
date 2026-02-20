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
