<script setup lang="ts">
import type { Device } from 'dirigera'

const { devices } = defineProps<{
  devices: Device[]
}>()

defineSlots<{
  default(props: { devices: Device[] }): unknown
}>()

const selectedFilters = ref<string[]>(['all'])

const productTypeItems = [
  { label: 'Lights', value: 'type:light', icon: 'i-lucide-lightbulb' },
  { label: 'Plugs', value: 'type:outlet', icon: 'i-lucide-plug' },
  { label: 'Remotes', value: 'type:controller', icon: 'i-lucide-toggle-left' },
  { label: 'Sensors', value: 'type:sensor', icon: 'i-lucide-radar' },
]

const filterItems = computed(() => {
  const rooms = new Map(
    devices.flatMap(device =>
      device.room ? [[device.room.id, device.room.name] as const] : []
    )
  )
  const roomItems = [...rooms]
    .sort(([, first], [, second]) => first.localeCompare(second))
    .map(([id, label]) => ({
      label,
      value: `room:${id}`,
      icon: 'i-lucide-house',
    }))

  if (devices.some(device => !device.room)) {
    roomItems.push({
      label: 'No room',
      value: 'room:unassigned',
      icon: 'i-lucide-house-x',
    })
  }

  return [
    { label: 'FILTERS', value: 'all', icon: 'i-lucide-list' },
    {
      type: 'separator' as const,
      label: '',
      value: 'separator:product-type',
    },
    {
      type: 'label' as const,
      label: 'Product type',
      value: 'label:product-type',
    },
    ...productTypeItems,
    { type: 'separator' as const, label: '', value: 'separator:room' },
    { type: 'label' as const, label: 'Room', value: 'label:room' },
    ...roomItems,
  ]
})

const filteredDevices = computed(() => {
  if (selectedFilters.value.includes('all')) return devices

  const types = selectedFilters.value
    .filter(value => value.startsWith('type:'))
    .map(value => value.slice('type:'.length))
  const rooms = selectedFilters.value
    .filter(value => value.startsWith('room:'))
    .map(value => value.slice('room:'.length))

  return devices.filter(
    device =>
      (!types.length || types.includes(device.type)) &&
      (!rooms.length || rooms.includes(device.room?.id ?? 'unassigned'))
  )
})

const hasActiveFilters = computed(() => !selectedFilters.value.includes('all'))

function updateSelectedFilters(value: unknown) {
  const next = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  const allWasSelected = selectedFilters.value.includes('all')

  if (next.includes('all') && !allWasSelected) {
    selectedFilters.value = ['all']
    return
  }

  const active = next.filter(item => item !== 'all')
  selectedFilters.value = active.length ? active : ['all']
}
</script>

<template>
  <UFormField>
    <USelectMenu
      :model-value="selectedFilters"
      :items="filterItems"
      value-key="value"
      multiple
      icon="i-lucide-list-filter"
      aria-label="Filter devices"
      class="w-full sm:w-80"
      @update:model-value="updateSelectedFilters"
    />
  </UFormField>

  <slot :devices="filteredDevices" />

  <UAlert
    v-if="hasActiveFilters && filteredDevices.length === 0"
    color="neutral"
    title="No devices match the selected filters"
  />
</template>
