<script setup lang="ts">
import type { Device } from '../services/dirigera-client'
import {
  clampColorTemperature,
  getColorTemperatureRange,
} from '../../config/color-temperature'

const dirigera = useDirigera()
const cache = useDirigeraCacheStore()
const toast = useToast()
const lights = ref<Device[]>([])
const state = reactive({ selectedIds: [] as string[], temperature: 3000 })
const loading = ref(false)
const applying = ref(false)
const loadError = ref(false)
const powerPending = ref<Record<string, boolean>>({})
let initializedSelection = false
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
    return {
      label: light.name,
      value: light.id,
      disabled: !light.isReachable,
      class: state.selectedIds.includes(light.id)
        ? undefined
        : '!border-default !bg-transparent !z-auto',
      light,
      range: `${limits.min}–${limits.max} K${limits.reported ? '' : ' (fallback range)'}`,
      productName: light.productName,
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
    if (!initializedSelection) {
      selectAll()
      const activeTemperatures = available.value.flatMap(light =>
        light.isOn && light.colorTemperature != null
          ? [light.colorTemperature]
          : []
      )
      if (activeTemperatures.length) {
        state.temperature = Math.round(
          activeTemperatures.reduce(
            (sum, temperature) => sum + temperature,
            0
          ) / activeTemperatures.length
        )
      }
      initializedSelection = true
    } else {
      state.selectedIds = state.selectedIds.filter(id =>
        available.value.some(light => light.id === id)
      )
    }
  } catch {
    loadError.value = true
    toast.add({
      title: 'Unable to load lights',
      description:
        'Check the hub connection and refresh before applying changes.',
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    })
  } finally {
    loading.value = false
  }
}

function selectAll() {
  state.selectedIds = available.value.map(light => light.id)
}

async function setPower(light: Device, isOn: boolean) {
  if (powerPending.value[light.id] || !light.isReachable) return

  powerPending.value = { ...powerPending.value, [light.id]: true }
  try {
    await dirigera.controlDevice(light.id, 'DEVICE', {
      type: 'setIsOn',
      isOn,
    })
    light.isOn = isOn
    cache.invalidateAll()
    toast.add({
      title: `${light.name} turned ${isOn ? 'on' : 'off'}`,
      color: 'success',
      icon: isOn ? 'i-lucide-lightbulb' : 'i-lucide-lightbulb-off',
    })
  } catch {
    toast.add({
      title: `Unable to turn ${light.name} ${isOn ? 'on' : 'off'}`,
      description: 'Check the hub connection and try again.',
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    })
  } finally {
    powerPending.value = { ...powerPending.value, [light.id]: false }
  }
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
    const updatedCount = targets.length - failed.length
    toast.add({
      title: `Updated ${updatedCount} lights`,
      description: failed.length
        ? `Failed: ${failed.join(', ')}. You can retry these lights.`
        : 'Color temperature applied.',
      color: failed.length ? 'error' : 'success',
      icon: failed.length ? 'i-lucide-triangle-alert' : 'i-lucide-check',
    })
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
    <h1 class="sr-only">White spectrum</h1>

    <UForm
      :state="state"
      class="space-y-6"
      :disabled="applying || loading || loadError"
      @submit="apply"
    >
      <UCard
        class="max-w-200"
        description="Warm white to cool white. Each light uses its nearest supported temperature when the value is outside its range."
        :ui="{ title: 'flex gap-4' }"
      >
        <template #title>
          <span>Color temperature</span>

          <UBadge
            :label="`${state.temperature} K`"
            color="secondary"
            size="lg"
            variant="subtle"
            class="tabular-nums"
          />
        </template>
        <UFormField name="temperature">
          <USlider
            v-model="state.temperature"
            color="secondary"
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

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UButton
              type="button"
              icon="i-lucide-list-check"
              label="Select available"
              aria-label="Select all lights"
              :disabled="applying || loading || loadError || !available.length"
              @click="selectAll"
            >
            </UButton>
            <UButton
              type="button"
              icon="i-lucide-x"
              label="Clear selection"
              aria-label="Clear all lights"
              :disabled="applying || loading || loadError"
              @click="state.selectedIds = []"
            />
            <UFieldGroup size="md">
              <UButton
                type="submit"
                size="md"
                class="min-w-52 justify-center"
                icon="i-lucide-circle-check-big"
                :label="
                  selected.length
                    ? 'Apply color temperature'
                    : 'Select at least one light'
                "
                :color="selected.length ? 'primary' : 'neutral'"
                variant="subtle"
                aria-label="Apply white spectrum"
                :loading="applying"
                :disabled="applying || loading || loadError || !selected.length"
              >
              </UButton>
              <UBadge
                :label="selected.length"
                size="md"
                :color="selected.length ? 'primary' : 'neutral'"
              />
            </UFieldGroup>
            <UButton
              :loading="loading"
              :trailing="true"
              :disabled="applying"
              label="Refresh"
              icon="i-lucide-refresh-cw"
              aria-label="Refresh lights"
              @click="load"
            />
          </div>
        </template>
      </UCard>

      <UCheckboxGroup
        v-model="state.selectedIds"
        name="selectedIds"
        :items="items"
        :ui="{
          label: 'flex',
          fieldset: 'gap-2',
          root: 'max-w-100',
          description: 'flex gap-2 items-center justify-between',
          wrapper: 'grid gap-3',
        }"
      >
        <template #label="{ item }">
          <span>{{ item.label }}</span>
          <span
            v-if="item.light.roomName"
            class="ml-auto tracking-widest font-light uppercase"
          >
            {{ item.light.roomName }}
          </span>
        </template>

        <template #description="{ item }">
          <UBadge
            v-if="item.light.lightLevel != null"
            icon="i-lucide-lightbulb"
            :variant="item.light.isOn ? 'subtle' : 'soft'"
            :class="['min-w-15', { 'opacity-75': !item.light.isOn }]"
          >
            {{ item.light.lightLevel }}%
          </UBadge>

          <ClientOnly>
            <UiSwitch
              v-if="item.light.isOn != null"
              mode="light"
              color="info"
              size="md"
              :model-value="item.light.isOn"
              :loading="powerPending[item.light.id]"
              :disabled="!item.light.isReachable"
              :aria-label="`Turn ${item.light.name} ${item.light.isOn ? 'off' : 'on'}`"
              @click.stop.prevent
              @pointerdown.stop
              @update:model-value="setPower(item.light, Boolean($event))"
            />
          </ClientOnly>

          <UBadge variant="soft">{{ item.range }}</UBadge>

          <UBadge icon="i-lucide-thermometer-sun" size="md">
            {{
              item.light.colorTemperature != null
                ? `${item.light.colorTemperature} K`
                : 'Unavailable'
            }}
          </UBadge>
        </template>
      </UCheckboxGroup>
      <p v-if="!loading && !loadError && !available.length" class="text-muted">
        No reachable lights support color temperature.
      </p>
    </UForm>
    <p class="text-muted">
      <b>White spectrum:</b> Set the color temperature of selected lights across
      your home, including individual lights in groups.
    </p>
  </UContainer>
</template>
