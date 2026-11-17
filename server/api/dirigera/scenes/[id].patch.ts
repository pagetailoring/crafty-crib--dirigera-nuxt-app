import {
  createError,
  defineEventHandler,
  getHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setResponseHeader,
} from 'h3'
import {
  isSceneUpdateInput,
  SceneEditError,
  updateScene,
} from '@@/server/utils/dirigera-scenes'
import { dirigeraConnection } from '@@/server/utils/dirigera'

export default defineEventHandler(async event => {
  const origin = getHeader(event, 'origin')
  if (origin && origin !== getRequestURL(event).origin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-origin requests are not allowed.',
    })
  }

  const id = getRouterParam(event, 'id')
  const body: unknown = await readBody(event)
  if (!id || !isSceneUpdateInput(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid scene update.',
    })
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    return await updateScene(await dirigeraConnection.getClient(), id, body)
  } catch (error) {
    if (error instanceof SceneEditError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      })
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to update the scene on the Dirigera hub.',
    })
  }
})
