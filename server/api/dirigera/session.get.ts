import { defineEventHandler, setResponseHeader } from 'h3'
import { createUpdateToken } from '../../utils/dirigera-session'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { token: createUpdateToken() }
})
