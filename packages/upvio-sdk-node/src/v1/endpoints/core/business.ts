import { type ApiV1Response, type GetData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type BusinessPath = apiTypes.paths['/businesses/{businessId}']

export const retrieveBusiness = <T extends GetData<BusinessPath>>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('', { method: 'GET' }, client)
}
