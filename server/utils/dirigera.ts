import { useRuntimeConfig } from 'nitropack/runtime'
import { createDirigeraClient } from 'dirigera'
import {
  createDirigeraConnection,
  DirigeraConnectionError,
} from '../services/dirigera-connection'

export const dirigeraConnection = createDirigeraConnection(async () => {
  const config = useRuntimeConfig()
  const accessToken = config.dirigeraAccessToken || process.env.ACCESS_TOKEN
  if (!accessToken) {
    throw new DirigeraConnectionError(
      'missing-token',
      'NUXT_DIRIGERA_ACCESS_TOKEN is not configured.'
    )
  }
  const gatewayIP =
    config.dirigeraGatewayIp || process.env.GATEWAY_IP || undefined
  try {
    return await createDirigeraClient({ gatewayIP, accessToken })
  } catch (cause) {
    throw new DirigeraConnectionError(
      gatewayIP ? 'hub-unreachable' : 'discovery-failed',
      gatewayIP
        ? 'The configured Dirigera hub is unavailable.'
        : 'No Dirigera hub could be discovered.',
      { cause }
    )
  }
})
