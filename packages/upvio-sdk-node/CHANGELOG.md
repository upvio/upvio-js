# Changelog

## 0.1.1 - Unreleased

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
