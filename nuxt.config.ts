// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/ui',
    '@nuxt/test-utils/module',

    '@nuxtjs/html-validator',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    dirigeraBaseUrl: process.env.DIRIGERA_BASE_URL ?? 'http://localhost:4000',
    dirigeraPassword: process.env.DIRIGERA_PASSWORD ?? process.env.PASSWORD,
  },

  typescript: {
    typeCheck: true,
    strict: true,
  },

  eslint: { config: { stylistic: true } },
})
