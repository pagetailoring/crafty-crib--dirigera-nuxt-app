import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { APP_NAME } from '../config/app.ts'

const publicDirectory = new URL('../.output/public/', import.meta.url)
const manifestPath = new URL('manifest.webmanifest', publicDirectory)
const serviceWorkerPath = new URL('sw.js', publicDirectory)
const clientAssetsPath = new URL('_nuxt/', publicDirectory)

const [manifestSource, serviceWorker, clientAssetNames] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(serviceWorkerPath, 'utf8'),
  readdir(clientAssetsPath),
])

const manifest = JSON.parse(manifestSource)

assert.equal(manifest.name, APP_NAME)
assert.equal(manifest.short_name, APP_NAME)
assert.equal(manifest.start_url, '/')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.theme_color, '#0059aa')
assert.equal(manifest.background_color, '#1f1f1f')

assert.match(serviceWorker, /self\.skipWaiting\(\)/)
assert.match(serviceWorker, /clientsClaim\(\)/)
assert.match(serviceWorker, /precacheAndRoute\(/)

const precachedUrls = Array.from(
  serviceWorker.matchAll(/\{url:["']([^"']+)["']/g),
  match => match[1]
)

assert.ok(precachedUrls.includes('manifest.webmanifest'))
assert.ok(
  precachedUrls.some(url => url.startsWith('_nuxt/') && url.endsWith('.js'))
)
assert.ok(
  precachedUrls.some(url => url.startsWith('_nuxt/') && url.endsWith('.css'))
)
assert.ok(precachedUrls.includes('favicon.ico'))

const forbiddenLiveDataPatterns = [
  /graphql/i,
  /dirigera-updates/i,
  /websocket/i,
  /\/api\//i,
]

for (const url of precachedUrls) {
  for (const pattern of forbiddenLiveDataPatterns) {
    assert.doesNotMatch(url, pattern)
  }
}

assert.doesNotMatch(serviceWorker, /registerRoute\(/)

const clientBundle = (
  await Promise.all(
    clientAssetNames
      .filter(name => name.endsWith('.js'))
      .map(name => readFile(join(clientAssetsPath.pathname, name), 'utf8'))
  )
).join('\n')

assert.match(clientBundle, /new [A-Za-z_$][\w$]*\(`\/sw\.js`/)
assert.match(clientBundle, /messageSkipWaiting\(\)/)
assert.match(clientBundle, /window\.location\.reload\(\)/)

console.log('PWA production build verification passed.')
