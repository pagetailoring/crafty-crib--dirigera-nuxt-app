import { defineNitroPlugin } from 'nitropack/runtime'
import { dirigeraConnection } from '@@/server/utils/dirigera'

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('close', () => dirigeraConnection.close())
})
