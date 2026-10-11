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

  typescript: {
    typeCheck: true,
    strict: true,
  },

  eslint: { config: { stylistic: true } },
})
