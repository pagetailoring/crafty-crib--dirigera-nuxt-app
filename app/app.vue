<script setup lang="ts">
useDirigeraUpdates(() => refreshNuxtData())
useHead({
  htmlAttrs: { lang: 'en' },
  title: 'Dirigera web',
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <main class="min-h-screen bg-default p-4 sm:p-6">
      <header class="mb-6 flex items-center gap-3">
        <h1>
          <NuxtLink to="/" class="text-3xl font-bold text-highlighted">
            Dirigera web
          </NuxtLink>
        </h1>
      </header>
      <NuxtPage />
    </main>
  </UApp>
</template>
