import { type ApiV1Response, type ResponseData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type CreatePatientBody = NonNullable<
  apiTypes.operations['createPatient']['requestBody']
>['content']['application/json']

type CreatePatientData =
  apiTypes.operations['createPatient']['responses']['201']['content']['application/json']['data']

type UpdatePatientBody = NonNullable<
  apiTypes.operations['updatePatient']['requestBody']
>['content']['application/json']

type UpdatePatientData =
  apiTypes.operations['updatePatient']['responses']['200']['content']['application/json']

export const listPatients = <
  T extends ResponseData<apiTypes.operations['listPatients']>,
>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('/patients', { method: 'GET' }, client)
}

export const retrievePatient = <
  T extends ResponseData<apiTypes.operations['retrievePatient']>,
>(
  client: UpvioApiClient,
  patientId: string,
): Promise<ApiV1Response<T>> => {
  return request<T>(`/patients/${patientId}`, { method: 'GET' }, client)
}

export const updatePatient = <T extends UpdatePatientData>(
  client: UpvioApiClient,
  patientId: string,
  body: UpdatePatientBody,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    `/patients/${patientId}`,
    { method: 'PUT', body: JSON.stringify(body) },
    client,
  )
}

export const createPatient = <T extends CreatePatientData>(
  client: UpvioApiClient,
  body: CreatePatientBody,
): Promise<ApiV1Response<T>> => {
  return request<T>(
    '/patients',
    { method: 'POST', body: JSON.stringify(body) },
    client,
  )
}
