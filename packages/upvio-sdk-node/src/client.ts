type UpvioApiClientOptions = {
  apiKey: string
  businessId: string
  baseUrl?: string
}

type V1 = typeof import('./v1')

export class UpvioApiClient {
  options: UpvioApiClientOptions

  constructor(options: UpvioApiClientOptions) {
    options.baseUrl = options.baseUrl || 'https://api.upvio.com'
    this.options = options
  }

  get v1() {
    const v1 = () => import('./v1')
    return {
      core: {
        businesses: {
          retrieve: () => v1().then((e) => e.retrieveBusiness(this)),
        },
        patients: {
          list: () => v1().then((e) => e.listPatients(this)),
          retrieve: (patientId: string) =>
            v1().then((e) => e.retrievePatient(this, patientId)),
          create: (body: Parameters<V1['createPatient']>[1]) =>
            v1().then((e) => e.createPatient(this, body)),
          update: (
            patientId: string,
            body: Parameters<V1['updatePatient']>[2],
          ) => v1().then((e) => e.updatePatient(this, patientId, body)),
          createMagicLink: (
            patientId: string,
            body: Parameters<V1['createPatientMagicLink']>[2],
          ) =>
            v1().then((e) => e.createPatientMagicLink(this, patientId, body)),
        },
      },
      vitals: {
        links: {
          list: (params?: Parameters<V1['listVitalsLinks']>[1]) =>
            v1().then((e) => e.listVitalsLinks(this, params)),
          retrieve: (linkId: string) =>
            v1().then((e) => e.retrieveVitalsLink(this, linkId)),
        },
        scans: {
          list: (params?: Parameters<V1['listVitalsScans']>[1]) =>
            v1().then((e) => e.listVitalsScans(this, params)),
          create: (body: Parameters<V1['createVitalsScan']>[1]) =>
            v1().then((e) => e.createVitalsScan(this, body)),
          retrieve: (scanId: string) =>
            v1().then((e) => e.retrieveVitalsScan(this, scanId)),
        },
        templates: {
          list: () => v1().then((e) => e.listVitalsTemplates(this)),
          retrieve: (templateId: string) =>
            v1().then((e) => e.retrieveVitalsTemplate(this, templateId)),
        },
      },
    }
  }
}
