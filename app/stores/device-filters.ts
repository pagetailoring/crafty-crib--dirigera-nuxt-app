import type { Device } from 'dirigera'
import { defineStore } from 'pinia'

export const useDeviceFiltersStore = defineStore('device-filters', () => {
  const devices = ref<Device[] | null>(null)
  const selectedFilters = ref<string[]>(['all'])

  const filteredDevices = computed(() => {
    if (!devices.value) return []
    if (selectedFilters.value.includes('all')) return devices.value

    const types = selectedFilters.value
      .filter(value => value.startsWith('type:'))
      .map(value => value.slice('type:'.length))
    const rooms = selectedFilters.value
      .filter(value => value.startsWith('room:'))
      .map(value => value.slice('room:'.length))

    return devices.value.filter(
      device =>
        (!types.length || types.includes(device.type)) &&
        (!rooms.length || rooms.includes(device.room?.id ?? 'unassigned'))
    )
  })

  const hasActiveFilters = computed(
    () => !selectedFilters.value.includes('all')
  )

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

  return {
    devices,
    selectedFilters,
    filteredDevices,
    hasActiveFilters,
    updateSelectedFilters,
  }
})
