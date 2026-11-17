import { createError, defineEventHandler, setResponseHeader } from 'h3'
import { listSceneProducts } from '@@/server/utils/dirigera-scenes'
import { dirigeraConnection } from '@@/server/utils/dirigera'

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    return await listSceneProducts(await dirigeraConnection.getClient())
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to load products from the Dirigera hub.',
    })
  }
})
