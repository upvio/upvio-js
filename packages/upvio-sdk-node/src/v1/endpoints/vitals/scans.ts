import {
  type ApiV1Response,
  type GetData,
  type GetQueryParams,
  type PostBody,
  type PostData,
  request,
} from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type ScansPath = apiTypes.paths['/businesses/{businessId}/vitals/scans']
type ScanPath = apiTypes.paths['/businesses/{businessId}/vitals/scans/{id}']

export const listVitalsScans = <T extends GetData<ScansPath>>(
  client: UpvioApiClient,
  params?: GetQueryParams<ScansPath>,
): Promise<ApiV1Response<T>> => {
  return request<T>('/vitals/scans', { method: 'GET' }, client, params)
}

export const createVitalsScan = <T extends PostData<ScansPath>>(
  client: UpvioApiClient,
  body: PostBody<ScansPath>,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    '/vitals/scans',
    { method: 'POST', body: JSON.stringify(body) },
    client,
  )
}

export const retrieveVitalsScan = <T extends GetData<ScanPath>>(
  client: UpvioApiClient,
  scanId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(`/vitals/scans/${scanId}`, { method: 'GET' }, client)
}
