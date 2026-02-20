import {
  type ApiV1Response,
  type GetData,
  type GetQueryParams,
  request,
} from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type LinksPath = apiTypes.paths['/businesses/{businessId}/vitals/links']
type LinkPath = apiTypes.paths['/businesses/{businessId}/vitals/links/{id}']

export const listVitalsLinks = <T extends GetData<LinksPath>>(
  client: UpvioApiClient,
  params?: GetQueryParams<LinksPath>,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/links', { method: 'GET' }, client, params)
}

export const retrieveVitalsLink = <T extends GetData<LinkPath>>(
  client: UpvioApiClient,
  linkId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(`/vitals/links/${linkId}`, { method: 'GET' }, client)
}
