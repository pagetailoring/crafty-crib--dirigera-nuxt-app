import { describe, expect, it, vi } from 'vitest'

import { createGraphqlRequest } from '~/utils/graphql-request'

describe('GraphQL request adapter', () => {
  it('returns GraphQL data from the Nuxt server endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue({ data: { scenes: [] } })
    const request = createGraphqlRequest(fetch)

    await expect(request('query Scenes { scenes { id } }')).resolves.toEqual({
      scenes: [],
    })
    expect(fetch).toHaveBeenCalledWith('/api/dirigera/graphql', {
      method: 'POST',
      body: {
        query: 'query Scenes { scenes { id } }',
        variables: undefined,
      },
    })
  })

  it('reports every GraphQL error returned by the backend', async () => {
    const fetch = vi.fn().mockResolvedValue({
      errors: [
        { message: 'The scene does not exist.' },
        { message: 'The hub is unavailable.' },
      ],
    })
    const request = createGraphqlRequest(fetch)

    await expect(
      request('mutation ActivateScene { activateScene }')
    ).rejects.toThrow(`The scene does not exist.\nThe hub is unavailable.`)
  })

  it('rejects a response without GraphQL data', async () => {
    const fetch = vi.fn().mockResolvedValue({})
    const request = createGraphqlRequest(fetch)

    await expect(request('query Scenes { scenes { id } }')).rejects.toThrow(
      'The Dirigera backend returned no data.'
    )
  })
})
