import {
  type ApiV1Response,
  type QueryParams,
  type ResponseData,
  request,
} from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

export const listVitalsLinks = <
  T extends ResponseData<apiTypes.operations['listVitalsLinks']>,
>(
  client: UpvioApiClient,
  params?: QueryParams<apiTypes.operations['listVitalsLinks']>,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/links', { method: 'GET' }, client, params)
}

export const retrieveVitalsLink = <
  T extends ResponseData<apiTypes.operations['retrieveVitalsLink']>,
>(
  client: UpvioApiClient,
  linkId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(`/vitals/links/${linkId}`, { method: 'GET' }, client)
}
