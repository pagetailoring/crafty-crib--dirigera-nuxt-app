import { APP_NAME } from './config/app'

/**  Build flags */
const isDevelopment = process.env.NODE_ENV === 'development'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    // '@nuxt/hints',
    '@nuxt/ui',
    '@nuxt/test-utils/module',

    '@nuxtjs/html-validator',

    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vite-pwa/nuxt',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: APP_NAME,
    },
  },
  css: isDevelopment
    ? ['~/assets/css/main.css', '~/assets/css/dev.css']
    : ['~/assets/css/main.css'],

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

  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      maximumFileSizeToCacheInBytes: 6_000_000,
      navigateFallback: undefined,
      runtimeCaching: [],
    },
    manifest: {
      short_name: APP_NAME,
      name: APP_NAME,
      start_url: '/',
      display: 'standalone',
      theme_color: '#0059aa',
      background_color: '#1f1f1f',
      // icons: [
      //   {
      //     src: '/logo192.png',
      //     sizes: '192x192',
      //     type: 'image/png',
      //   },
      //   {
      //     src: '/logo512.png',
      //     sizes: '512x512',
      //     type: 'image/png',
      //   },
      //   {
      //     src: '/logo192_maskable.png',
      //     sizes: '192x192',
      //     type: 'image/png',
      //     purpose: 'maskable',
      //   },
      //   {
      //     src: '/logo512_maskable.png',
      //     sizes: '512x512',
      //     type: 'image/png',
      //     purpose: 'maskable',
      //   },
      // ],
    },
  },
})
