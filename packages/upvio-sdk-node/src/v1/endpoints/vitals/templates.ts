import { type ApiV1Response, type GetData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type TemplatesPath =
  apiTypes.paths['/businesses/{businessId}/vitals/templates']
type TemplatePath =
  apiTypes.paths['/businesses/{businessId}/vitals/templates/{id}']

export const listVitalsTemplates = <T extends GetData<TemplatesPath>>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/templates', { method: 'GET' }, client)
}

export const retrieveVitalsTemplate = <T extends GetData<TemplatePath>>(
  client: UpvioApiClient,
  templateId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    `/vitals/templates/${templateId}`,
    { method: 'GET' },
    client,
  )
}
