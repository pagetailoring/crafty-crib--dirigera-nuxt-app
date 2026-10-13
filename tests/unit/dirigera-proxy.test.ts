import { describe, expect, it, vi } from 'vitest'

import { createDirigeraProxy } from '../../server/utils/dirigera-proxy'

describe('Dirigera server proxy', () => {
  it('logs in once and forwards GraphQL requests with the token', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { login: 'session-token' } })
      .mockResolvedValue({ data: { rooms: [] } })
    const proxy = createDirigeraProxy(fetch, 'http://localhost:4000', 'secret')

    await proxy.request({ query: 'query Rooms { rooms { id } }' })
    await proxy.request({ query: 'query Rooms { rooms { id } }' })

    expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:4000/graphql', {
      method: 'POST',
      body: {
        query: expect.stringContaining('mutation Login'),
        variables: { password: 'secret' },
      },
    })
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'x-token': 'session-token' },
      body: { query: 'query Rooms { rooms { id } }' },
    })
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
