import { type ApiV1Response, type ResponseData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

export const listVitalsTemplates = <
  T extends ResponseData<apiTypes.operations['listVitalsTemplates']>,
>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/templates', { method: 'GET' }, client)
}

export const retrieveVitalsTemplate = <
  T extends ResponseData<apiTypes.operations['retrieveVitalsTemplate']>,
>(
  client: UpvioApiClient,
  templateId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    `/vitals/templates/${templateId}`,
    { method: 'GET' },
    client,
  )
}
