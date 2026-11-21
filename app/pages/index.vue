<script setup lang="ts">
const cache = useDirigeraCacheStore()
const error = ref<Error | null>(null)

try {
  await cache.loadHome()
} catch (cause) {
  error.value = cause instanceof Error ? cause : new Error(String(cause))
}
</script>

<template>
  <UContainer>
    <h1 class="sr-only">Home page</h1>
    <ScenesListHomePage />

    <UAlert
      v-if="error"
      color="error"
      title="Unable to load the home"
      :description="error.message"
    />

    <RoomsListHomePage />
  </UContainer>
</template>
