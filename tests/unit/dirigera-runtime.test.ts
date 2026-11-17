import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  config: {
    value: {
      dirigeraAccessToken: '',
      dirigeraGatewayIp: '',
    },
  },
  createDirigeraClient: vi.fn(),
}))

vi.mock('dirigera', () => ({
  createDirigeraClient: mocks.createDirigeraClient,
}))

vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => mocks.config.value,
}))

const loadConnection = async () =>
  (await import('@@/server/utils/dirigera')).dirigeraConnection

const connectedClient = () => ({
  home: vi.fn().mockResolvedValue({}),
  startListeningForUpdates: vi.fn(),
  stopListeningForUpdates: vi.fn(),
})

describe('Dirigera runtime connection', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.createDirigeraClient.mockReset()
    mocks.config.value = {
      dirigeraAccessToken: '',
      dirigeraGatewayIp: '',
    }
    vi.stubEnv('ACCESS_TOKEN', '')
    vi.stubEnv('GATEWAY_IP', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports a missing access token without creating a library client', async () => {
    const connection = await loadConnection()

    await expect(connection.getClient()).rejects.toMatchObject({
      name: 'DirigeraConnectionError',
      reason: 'missing-token',
      statusCode: 503,
    })
    expect(connection.getStatus()).toMatchObject({
      state: 'unavailable',
      reason: 'missing-token',
    })
    expect(mocks.createDirigeraClient).not.toHaveBeenCalled()
  })

  it('creates a client with the configured gateway and access token', async () => {
    const client = connectedClient()
    mocks.config.value = {
      dirigeraAccessToken: 'config-token',
      dirigeraGatewayIp: '192.0.2.10',
    }
    mocks.createDirigeraClient.mockResolvedValue(client)
    const connection = await loadConnection()

    await expect(connection.getClient()).resolves.toBe(client)
    expect(mocks.createDirigeraClient).toHaveBeenCalledWith({
      accessToken: 'config-token',
      gatewayIP: '192.0.2.10',
    })
    await connection.close()
  })

  it('falls back to environment credentials', async () => {
    const client = connectedClient()
    vi.stubEnv('ACCESS_TOKEN', 'environment-token')
    vi.stubEnv('GATEWAY_IP', '192.0.2.20')
    mocks.createDirigeraClient.mockResolvedValue(client)
    const connection = await loadConnection()

    await expect(connection.getClient()).resolves.toBe(client)
    expect(mocks.createDirigeraClient).toHaveBeenCalledWith({
      accessToken: 'environment-token',
      gatewayIP: '192.0.2.20',
    })
    await connection.close()
  })

  it.each([
    {
      gatewayIP: '',
      reason: 'discovery-failed',
      message: 'No Dirigera hub could be discovered.',
    },
    {
      gatewayIP: '192.0.2.30',
      reason: 'hub-unreachable',
      message: 'The configured Dirigera hub is unavailable.',
    },
  ])(
    'reports $reason when client creation fails',
    async ({ gatewayIP, reason, message }) => {
      mocks.config.value = {
        dirigeraAccessToken: 'config-token',
        dirigeraGatewayIp: gatewayIP,
      }
      mocks.createDirigeraClient.mockRejectedValue(
        new Error('connection failed')
      )
      const connection = await loadConnection()

      await expect(connection.getClient()).rejects.toMatchObject({
        name: 'DirigeraConnectionError',
        reason,
        message,
        statusCode: 503,
      })
      expect(connection.getStatus()).toMatchObject({
        state: 'unavailable',
        reason,
      })
    }
  )
})
