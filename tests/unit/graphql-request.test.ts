import { describe, expect, it, vi } from 'vitest'

import { createGraphqlRequest } from '../../app/services/graphql-request'

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
})
