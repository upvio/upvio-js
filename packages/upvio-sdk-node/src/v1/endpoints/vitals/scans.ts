import {
  type ApiV1Response,
  type CreatedResponseData,
  type QueryParams,
  type RequestBody,
  type ResponseData,
  request,
} from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

export const listVitalsScans = <
  T extends ResponseData<apiTypes.operations['listVitalsScans']>,
>(
  client: UpvioApiClient,
  params?: QueryParams<apiTypes.operations['listVitalsScans']>,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/scans', { method: 'GET' }, client, params)
}

export const createVitalsScan = <
  T extends CreatedResponseData<apiTypes.operations['createVitalsScan']>,
>(
  client: UpvioApiClient,
  body: RequestBody<apiTypes.operations['createVitalsScan']>,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    '/vitals/scans',
    { method: 'POST', body: JSON.stringify(body) },
    client,
  )
}

export const retrieveVitalsScan = <
  T extends ResponseData<apiTypes.operations['retrieveVitalsScan']>,
>(
  client: UpvioApiClient,
  scanId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(`/vitals/scans/${scanId}`, { method: 'GET' }, client)
}
