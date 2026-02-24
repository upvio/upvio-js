import { type ApiV1Response, type ResponseData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

export const retrieveBusiness = <
  T extends ResponseData<apiTypes.operations['retrieveBusiness']>,
>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('', { method: 'GET' }, client)
}
