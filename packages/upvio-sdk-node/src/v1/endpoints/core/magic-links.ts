import {
  type ApiV1Response,
  type RequestBody,
  type ResponseData,
  request,
} from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type CreateMagicLinkBody = RequestBody<
  apiTypes.operations['createPatientMagicLink']
>

type CreateMagicLinkData = ResponseData<
  apiTypes.operations['createPatientMagicLink']
>

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
