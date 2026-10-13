<script setup lang="ts">
const route = useRoute()
const cache = useDirigeraCacheStore()

useDirigeraUpdates(() => {
  cache.invalidateAll()
  let refresh: Promise<unknown>
  if (route.name === 'room-id') {
    refresh = cache.loadRoom(String(route.params.id), { force: true })
  } else {
    refresh = cache.loadHome({ force: true })
  }

  void refresh.catch(error =>
    console.error('Unable to refresh Dirigera data', error)
  )
})
</script>

<template>
  <UApp>
    <NuxtPwaManifest />
    <NuxtRouteAnnouncer />
    <main class="min-h-screen bg-default p-4 sm:p-6">
      <header class="mb-6 flex items-center gap-3">
        <NuxtLink to="/" class="text-3xl font-bold text-highlighted">
          Dirigera web
        </NuxtLink>
      </header>
      <NuxtPage />
    </main>
  </UApp>
</template>
