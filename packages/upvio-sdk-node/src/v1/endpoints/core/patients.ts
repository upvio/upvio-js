import { type ApiV1Response, type GetData, request } from '../../request'

import type * as apiTypes from '@upvio/api-types/v1'
import type { UpvioApiClient } from '../../../client'

type PatientsPath = apiTypes.paths['/businesses/{businessId}/patients']
type PatientPath = apiTypes.paths['/businesses/{businessId}/patients/{id}']

type CreatePatientBody = NonNullable<
  PatientsPath['post']['requestBody']
>['content']['application/json']

type CreatePatientData =
  PatientsPath['post']['responses']['201']['content']['application/json']['data']

type UpdatePatientBody = NonNullable<
  PatientPath['put']['requestBody']
>['content']['application/json']

type UpdatePatientData =
  PatientPath['put']['responses']['200']['content']['application/json']

export const listPatients = <T extends GetData<PatientsPath>>(
  client: UpvioApiClient,
): Promise<ApiV1Response<T>> => {
  return request<T>('/patients', { method: 'GET' }, client)
}

export const retrievePatient = <T extends GetData<PatientPath>>(
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
