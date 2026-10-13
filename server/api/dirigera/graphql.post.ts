import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  createError,
  readBody,
  setResponseHeader,
} from 'h3'
import {
  executeDirigeraQuery,
  type GraphqlBody,
} from '../../services/dirigera-api'
import { dirigeraConnection } from '../../utils/dirigera'

export default defineEventHandler(async event => {
  const origin = getHeader(event, 'origin')
  if (origin && origin !== getRequestURL(event).origin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-origin requests are not allowed.',
    })
  }
  const body = await readBody<GraphqlBody>(event)
  if (
    !body ||
    typeof body.query !== 'string' ||
    (body.variables != null &&
      (typeof body.variables !== 'object' || Array.isArray(body.variables))) ||
    (body.operationName != null && typeof body.operationName !== 'string')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid GraphQL request.',
    })
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return executeDirigeraQuery(await dirigeraConnection.getClient(), body)
})
