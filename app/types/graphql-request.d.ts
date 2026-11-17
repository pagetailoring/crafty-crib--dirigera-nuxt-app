export interface GraphqlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export type Fetch = <T>(
  url: string,
  options: {
    method: 'POST'
    body: { query: string; variables: Record<string, unknown> | undefined }
  }
) => Promise<GraphqlResponse<T>>
