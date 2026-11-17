import { createError, defineEventHandler, setResponseHeader } from 'h3'
import { dirigeraConnection } from '@@/server/utils/dirigera'

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  try {
    const client = await dirigeraConnection.getClient()
    return (await client.home()).devices
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to load devices from the Dirigera hub.',
    })
  }
})
