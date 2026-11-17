import type { Fetch } from '~/types/graphql-request'

export function createGraphqlRequest(fetch: Fetch) {
  return async function request<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch<T>('/api/dirigera/graphql', {
      method: 'POST',
      body: { query, variables },
    })

    if (response.errors?.length) {
      throw new Error(response.errors.map(({ message }) => message).join('\n'))
    }

    if (!response.data) {
      throw new Error('The Dirigera backend returned no data.')
    }

    return response.data
  }
}
