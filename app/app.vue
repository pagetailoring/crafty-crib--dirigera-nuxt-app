<script setup lang="ts">
import { APP_NAME } from '../config/app'

const route = useRoute()
const cache = useDirigeraCacheStore()
const dirigeraStatus = useDirigeraStateStore()
const {
  status,
  pending: statusPending,
  error: statusError,
} = storeToRefs(dirigeraStatus)
let statusRetry: ReturnType<typeof setTimeout> | undefined

const unavailableMessage = computed(() => {
  if (statusError.value) return 'Unable to check the Dirigera connection.'
  if (status.value.state !== 'unavailable') return null
  if (status.value.reason === 'missing-token') {
    return 'The Dirigera access token is not configured.'
  }
  if (status.value.reason === 'discovery-failed') {
    return 'No Dirigera hub could be discovered on the local network.'
  }
  return 'The Dirigera hub is unavailable.'
})

async function refreshDirigeraStatus() {
  if (statusRetry) clearTimeout(statusRetry)
  try {
    await dirigeraStatus.refresh()
  } catch {
    // The store exposes the safe UI error state.
  }
  if (status.value.state === 'unavailable' || statusError.value) {
    statusRetry = setTimeout(refreshDirigeraStatus, 5_000)
  }
}

onMounted(refreshDirigeraStatus)
onUnmounted(() => {
  if (statusRetry) clearTimeout(statusRetry)
})

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
          {{ APP_NAME }}
        </NuxtLink>
      </header>
      <div
        v-if="unavailableMessage"
        class="mb-6 flex flex-wrap items-center gap-3"
      >
        <UAlert
          color="warning"
          title="Dirigera connection unavailable"
          :description="unavailableMessage"
          class="min-w-64 flex-1"
        />
        <UButton
          color="neutral"
          variant="outline"
          :loading="statusPending"
          @click="refreshDirigeraStatus"
        >
          Retry
        </UButton>
      </div>
      <UAlert
        v-else-if="status.state === 'idle' && statusPending"
        color="neutral"
        title="Connecting to Dirigera"
        class="mb-6"
      />
      <NuxtPage />
    </main>
  </UApp>
</template>
