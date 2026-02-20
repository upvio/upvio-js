/**
 * An error occurred while making an API request to Upvio.
 */
export class UpvioApiRequestError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string) {
    super(`Failed to fetch: ${status} ${statusText}`)
    this.status = status
    this.statusText = statusText
  }
}
