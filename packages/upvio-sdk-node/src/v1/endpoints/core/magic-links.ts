import { type ApiV1Response, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type MagicLinksPath =
  apiTypes.paths['/businesses/{businessId}/patients/{patientId}/magic-links']

type CreateMagicLinkBody =
  MagicLinksPath['post']['requestBody']['content']['application/json']

type CreateMagicLinkData =
  MagicLinksPath['post']['responses']['200']['content']['application/json']['data']

export const createPatientMagicLink = <T extends CreateMagicLinkData>(
  client: UpvioApiClient,
  patientId: string,
  body: CreateMagicLinkBody,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    `/patients/${patientId}/magic-links`,
    { method: 'POST', body: JSON.stringify(body) },
    client,
  )
}
