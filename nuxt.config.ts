// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/ui',
    '@nuxt/test-utils/module',

    '@nuxtjs/html-validator',
    '@pinia/nuxt',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Dirigera web',
    },
  },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    dirigeraGatewayIp: '',
    dirigeraAccessToken: '',
    public: {
      dirigeraWebSocketUrl: '',
    },
  },
  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'node-server',
    experimental: { websocket: true },
  },

  typescript: {
    typeCheck: true,
    strict: true,
  },

  eslint: { config: { stylistic: true } },
})
