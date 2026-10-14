<script setup lang="ts">
import { APP_NAME } from '@@/config/app'

const route = useRoute()
const cache = useDirigeraCacheStore()
const { roomById } = storeToRefs(cache)

const activeRoomName = computed(() => {
  if (route.name !== 'room-id') return null
  return roomById.value[String(route.params.id)]?.data.name ?? 'Room'
})
</script>

<template>
  <UHeader mode="drawer">
    <template #left>
      <UButton
        to="/"
        :aria-label="APP_NAME + ' - home page'"
        class="tracking-widest uppercase font-normal -ml-3"
        icon="i-lucide-home"
        :label="APP_NAME"
        variant="ghost"
        size="xl"
      />

      <template v-if="activeRoomName">
        <UButton
          to="/"
          icon="i-lucide-arrow-left"
          variant="ghost"
          aria-label="go back to home page"
        />
        <span class="">
          {{ activeRoomName }}
        </span>
      </template>
    </template>
  </UHeader>
</template>
