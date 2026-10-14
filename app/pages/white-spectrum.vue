<script setup lang="ts">
import type { Device } from '../services/dirigera-client'
import {
  clampColorTemperature,
  getColorTemperatureRange,
} from '../../config/color-temperature'

const dirigera = useDirigera()
const cache = useDirigeraCacheStore()
const lights = ref<Device[]>([])
const state = reactive({ selectedIds: [] as string[], temperature: 3000 })
const loading = ref(false)
const applying = ref(false)
const loadError = ref(false)
const result = ref<{ failed: string[]; count: number } | null>(null)
const available = computed(() =>
  lights.value.filter(light => light.isReachable)
)
const selected = computed(() =>
  available.value.filter(light => state.selectedIds.includes(light.id))
)
const range = computed(() => {
  const ranges = (selected.value.length ? selected.value : available.value).map(
    getColorTemperatureRange
  )
  return ranges.length
    ? {
        min: Math.min(...ranges.map(item => item.min)),
        max: Math.max(...ranges.map(item => item.max)),
      }
    : { min: 2202, max: 4000 }
})
const items = computed(() =>
  lights.value.map(light => {
    const limits = getColorTemperatureRange(light)
    const target = clampColorTemperature(state.temperature, light)
    return {
      label: light.name,
      value: light.id,
      disabled: !light.isReachable,
      description: [
        light.productName,
        `${limits.min}–${limits.max} K${limits.reported ? '' : ' (fallback range)'}`,
        light.isReachable ? `Target: ${target} K` : 'Unreachable',
      ]
        .filter(Boolean)
        .join(' · '),
    }
  })
)

watch(range, limits => {
  state.temperature = Math.min(
    limits.max,
    Math.max(limits.min, state.temperature)
  )
})

async function load() {
  loading.value = true
  loadError.value = false
  try {
    lights.value = await dirigera.listTemperatureLights()
    state.selectedIds = state.selectedIds.filter(id =>
      available.value.some(light => light.id === id)
    )
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function selectAll() {
  state.selectedIds = available.value.map(light => light.id)
}

async function apply() {
  if (
    applying.value ||
    loading.value ||
    loadError.value ||
    !selected.value.length
  )
    return
  applying.value = true
  result.value = null
  const targets = [...selected.value]
  const temperature = state.temperature
  try {
    const results = await Promise.allSettled(
      targets.map(light =>
        dirigera.controlDevice(light.id, 'DEVICE', {
          type: 'setColorTemperature',
          colorTemperature: clampColorTemperature(temperature, light),
        })
      )
    )
    const failed = targets
      .filter((_, index) => results[index]?.status === 'rejected')
      .map(light => light.name)
    result.value = { failed, count: targets.length - failed.length }
    cache.invalidateAll()
    await load()
  } finally {
    applying.value = false
  }
}

await load()
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <!-- <UButton to="/" color="neutral" variant="link" icon="i-lucide-arrow-left"
      >Home</UButton
    > -->
    <h1 class="sr-only">White spectrum</h1>
    <p class="text-muted">
      <b>White spectrum:</b> Set the color temperature of selected lights across
      your home, including individual lights in groups.
    </p>
    <UAlert
      v-if="loadError"
      color="error"
      title="Unable to load lights"
      description="Check the hub connection and refresh before applying changes."
    />

    <UForm
      :state="state"
      class="space-y-6"
      :disabled="applying || loading || loadError"
      @submit="apply"
    >
      <div class="flex gap-2">
        <UButton
          type="button"
          :disabled="applying || loading || loadError || !available.length"
          @click="selectAll"
          >Select all available ({{ available.length }})</UButton
        >
        <UButton
          type="button"
          variant="ghost"
          :disabled="applying || loading || loadError"
          @click="state.selectedIds = []"
          >Clear selection</UButton
        >
        <UButton
          :loading="loading"
          :trailing="true"
          :disabled="applying"
          label="Refresh list"
          icon="i-lucide-refresh-cw"
          @click="load"
        />
      </div>
      <UCheckboxGroup
        v-model="state.selectedIds"
        name="selectedIds"
        legend="Lights"
        :items="items"
      />
      <p v-if="!loading && !loadError && !available.length" class="text-muted">
        No reachable lights support color temperature.
      </p>
      <UFormField
        name="temperature"
        :label="`Color temperature ${state.temperature} K`"
        description="Warm white to cool white. Each light uses its nearest supported temperature when the value is outside its range. Target values are shown above."
      >
        <USlider
          v-model="state.temperature"
          :min="range.min"
          :max="range.max"
          :step="1"
          :disabled="applying || loading || loadError || !selected.length"
          aria-label="Shared color temperature"
        />
        <div class="mt-2 flex justify-between text-sm text-muted">
          <span>{{ range.min }} K</span><span>{{ range.max }} K</span>
        </div>
      </UFormField>
      <UButton
        type="submit"
        :loading="applying"
        :disabled="applying || loading || loadError || !selected.length"
        >Apply to selected lights ({{ selected.length }})</UButton
      >
    </UForm>
    <UAlert
      v-if="result"
      :color="result.failed.length ? 'error' : 'success'"
      :title="`Updated ${result.count} lights`"
      :description="
        result.failed.length
          ? `Failed: ${result.failed.join(', ')}. You can retry these lights.`
          : 'Color temperature applied.'
      "
    />
  </UContainer>
</template>
