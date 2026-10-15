<script setup lang="ts">
import { APP_NAME } from '@@/config/app'

const items = [
  { label: 'White Spectrum', icon: 'i-lucide-sun', to: '/white-spectrum' },
  { label: 'Scenes', icon: 'i-lucide-settings', to: '/scenes' },
  { label: 'Devices', icon: 'i-lucide-cpu', to: '/devices' },
]

const colorMode = useColorMode()
const colorModeItems = [
  {
    label: 'Light / dark mode',
    icon: 'i-lucide-sun-moon',
    onSelect() {
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    },
  },
]

const route = useRoute()
const cache = useDirigeraCacheStore()
const { roomById } = storeToRefs(cache)

const activeRoomName = computed(() => {
  if (route.name !== 'room-id') return null
  return roomById.value[String(route.params.id)]?.data.name ?? 'Room'
})

const activePageName = computed(
  () =>
    activeRoomName.value ??
    items.find(item => item.to === route.path)?.label ??
    null
)
</script>

<template>
  <UHeader
    mode="drawer"
    :ui="{ toggle: 'lg:inline-flex', content: 'lg:flex', overlay: 'lg:block' }"
    :toggle="{
      color: 'primary',
      variant: 'subtle',
      size: 'xl',
      class: 'rounded-full',
    }"
  >
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

      <template v-if="activePageName">
        <UButton
          to="/"
          icon="i-lucide-arrow-left"
          variant="ghost"
          aria-label="go back to home page"
        />
        <span class="">
          {{ activePageName }}
        </span>
      </template>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
      <USeparator icon="i-lucide-house" />
      <RoomsListMenuLinks />
      <USeparator icon="i-lucide-settings-2" />
      <UNavigationMenu :items="colorModeItems" orientation="vertical" />
    </template>
  </UHeader>
</template>
