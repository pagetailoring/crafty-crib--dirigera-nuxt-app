import { createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createDirigeraClient } from 'dirigera'
import { createDirigeraConnection } from '../services/dirigera-connection'

export const dirigeraConnection = createDirigeraConnection(async () => {
  const config = useRuntimeConfig()
  const accessToken = config.dirigeraAccessToken || process.env.ACCESS_TOKEN
  if (!accessToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_DIRIGERA_ACCESS_TOKEN is not configured.',
    })
  }
  return createDirigeraClient({
    gatewayIP: config.dirigeraGatewayIp || process.env.GATEWAY_IP || undefined,
    accessToken,
  })
})
