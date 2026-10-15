# Changelog

## 0.1.2 - 2026-10-15

### Fixed

- `@upvio/api-types` is now a dependency instead of a dev dependency. The
  published type declarations import it, so in 0.1.1 and earlier, fields
  that reference shared API schemas, such as a scan's `results` and
  `failureInfo`, were typed as `any` unless the app installed
  `@upvio/api-types` itself.

## 0.1.1 - 2026-10-15

### Added

- `client.v1.vitals.scans.createEmbedSession(scanId)` creates a URL that
  opens a pending or started scan in an iframe on one of the business's
  allowed origins.

### Changed

- Request and response types come from `@upvio/api-types` 0.1.2, which
  documents the error responses each endpoint can return.

## 0.1.0 - 2026-02-24

Initial release, with a client for the v1 API covering businesses, patients,
patient magic links, vitals links, vitals scans and vitals templates.
