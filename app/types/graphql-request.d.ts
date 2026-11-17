/** GraphQL response payload containing data or operation errors. */
export interface GraphqlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

/** Minimal fetch contract required by the app's GraphQL request wrapper. */
export type Fetch = <T>(
  url: string,
  options: {
    method: 'POST'
    body: { query: string; variables: Record<string, unknown> | undefined }
  }
) => Promise<GraphqlResponse<T>>
