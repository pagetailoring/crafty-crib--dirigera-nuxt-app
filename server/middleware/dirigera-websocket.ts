import { defineEventHandler, getRequestURL } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler((event) => {
  // Keep the existing frontend's absolute URL contract on this request's host.
  const url = getRequestURL(event)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/dirigera-updates'
  url.search = ''
  useRuntimeConfig(event).public.dirigeraWebSocketUrl = url.toString()
})
