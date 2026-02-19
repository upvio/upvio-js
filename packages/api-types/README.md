# Upvio API Types

Auto generated TypeScript types from our v1 API.
Intended for internal SDK usage rather than to be used directly.

## Usage

```typescript
import type { components } as apiTypes from '@upvio/api-types/v1'

type Patient = components.schemas.Patient

const patient: Patient = {
  id: 'patient_123',
  email: 'patient_123@example.com',
  name: 'Jane Doe',
}
```

```typescript
import type { paths } from '@upvio/api-types/v1'

type ListPatientsResponse = paths['/businesses/{businessId}/patients']['get']['responses']['200']['content']['application/json']['data']

const response = await fetch('https://api.upvio.com/v1/businesses/business_123/patients')
const patients = (await response.json()) as ListPatientsResponse
```
