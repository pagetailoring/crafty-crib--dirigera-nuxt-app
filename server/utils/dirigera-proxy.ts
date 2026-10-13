interface GraphqlBody {
  query: string
  variables?: Record<string, unknown>
}

interface GraphqlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

type Fetch = <T>(
  url: string,
  options: {
    method: 'POST'
    headers?: Record<string, string>
    body: GraphqlBody
  }
) => Promise<GraphqlResponse<T>>

const loginMutation = `
  mutation Login($password: String!) {
    login(password: $password)
  }
`

export function createDirigeraProxy(
  fetch: Fetch,
  baseUrl: string,
  password: string
) {
  let token: string | null = null

  async function getToken() {
    if (token) return token

    const response = await fetch<{ login: string }>(`${baseUrl}/graphql`, {
      method: 'POST',
      body: {
        query: loginMutation,
        variables: { password },
      },
    })

    token = response.data?.login ?? null
    if (!token) {
      throw new Error(
        response.errors?.map(({ message }) => message).join('\n') ||
          'The Dirigera backend did not return a session token.'
      )
    }

    return token
  }

  return {
    getToken,
    async request<T>(body: GraphqlBody) {
      return fetch<T>(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'x-token': await getToken() },
        body,
      })
    },
  }
}
