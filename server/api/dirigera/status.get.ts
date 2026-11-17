import { defineEventHandler, setResponseHeader } from 'h3'
import { dirigeraConnection } from '@@/server/utils/dirigera'

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    await dirigeraConnection.getClient()
  } catch {
    // The public status intentionally omits the private connection error.
  }
  return dirigeraConnection.getStatus()
})
