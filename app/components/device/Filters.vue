<script setup lang="ts">
import { getDeviceCategoryFilterItems } from '~/utils/device-categories'

const filters = useDeviceFiltersStore()
const { devices, selectedFilters } = storeToRefs(filters)

const productTypeItems = getDeviceCategoryFilterItems()

const filterItems = computed(() => {
  const rooms = new Map(
    (devices.value ?? []).flatMap(device =>
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

  if (devices.value?.some(device => !device.room)) {
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
</script>

<template>
  <USelectMenu
    :model-value="selectedFilters"
    :items="filterItems"
    value-key="value"
    :clear="true"
    multiple
    icon="i-lucide-filter"
    aria-label="Filter devices"
    class="w-12 sm:w-64"
    @update:model-value="filters.updateSelectedFilters"
  />
</template>
