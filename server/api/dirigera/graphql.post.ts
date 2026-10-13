import { createDirigeraProxy } from '../../utils/dirigera-proxy'

let proxy: ReturnType<typeof createDirigeraProxy> | null = null

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const password = config.dirigeraPassword

  if (!password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DIRIGERA_PASSWORD is not configured.',
    })
  }

  proxy ??= createDirigeraProxy($fetch, config.dirigeraBaseUrl, password)

  return proxy.request(await readBody(event))
})
