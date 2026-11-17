<script setup lang="ts">
import type { Scene } from 'dirigera'
import {
  SCENE_NUMERIC_CONTROLS,
  SCENE_PLAYBACK_LABELS,
  sceneNumericControl,
} from '@@/config/scene-controls'
import type { SceneNumericAttribute } from '@@/config/scene-controls'

const props = defineProps<{
  name: string
  product?: SceneProduct
  original?: Scene['actions'][number]['attributes']
  disabled?: boolean
}>()
const edits = defineModel<SceneAttributeEdits>({ required: true })
const emit = defineEmits<{ remove: [] }>()
const numericKeys = Object.keys(
  SCENE_NUMERIC_CONTROLS
) as SceneNumericAttribute[]
const numericControls = computed(() =>
  props.product
    ? numericKeys
        .filter(key => props.product!.capabilities.includes(key))
        .map(key => ({ key, ...sceneNumericControl(key, props.product!) }))
    : []
)
const playbackOptions = computed(
  () =>
    props.product?.playbackOptions.map(value => ({
      value,
      label: SCENE_PLAYBACK_LABELS[value] ?? value,
    })) ?? []
)
const description = computed(() =>
  props.product
    ? [
        props.product.productName,
        props.product.type === 'deviceSet' ? 'Device group' : undefined,
        ...props.product.groups.map(group => `Group: ${group.name}`),
        props.product.isReachable ? undefined : 'Currently offline',
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Product details unavailable. Existing settings are preserved.'
)

const productIcon = computed(() => {
  if (props.product?.type === 'deviceSet') return 'i-lucide-boxes'
  if (props.product?.capabilities.includes('playback'))
    return 'i-lucide-speaker'
  if (props.product?.capabilities.includes('colorTemperature')) {
    return 'i-lucide-lightbulb'
  }
  if (props.product?.canSetPower) return 'i-lucide-power'
  return 'i-lucide-package'
})

const controlIcons: Record<SceneNumericAttribute, string> = {
  lightLevel: 'i-lucide-lightbulb',
  colorTemperature: 'i-lucide-thermometer-sun',
  colorHue: 'i-lucide-palette',
  colorSaturation: 'i-lucide-droplets',
  volume: 'i-lucide-volume-2',
}

function value<K extends SceneAttribute>(key: K) {
  return Object.hasOwn(edits.value, key)
    ? edits.value[key]
    : props.original?.[key]
}

function setValue(
  key: SceneAttribute,
  next: SceneAttributeEdits[SceneAttribute]
) {
  const patch = { ...edits.value, [key]: next }
  if (next != null && key === 'colorTemperature') {
    patch.colorHue = null
    patch.colorSaturation = null
  } else if (
    next != null &&
    (key === 'colorHue' || key === 'colorSaturation')
  ) {
    patch.colorTemperature = null
  }
  edits.value = patch
}

function numericValue(key: SceneNumericAttribute, min: number) {
  const current = value(key)
  return typeof current === 'number' ? current : min
}

function formattedValue(key: SceneNumericAttribute, min: number, unit: string) {
  const current = numericValue(key, min)
  return formatControlValue(key, current, unit)
}

function formatControlValue(
  key: SceneNumericAttribute,
  current: number,
  unit: string
) {
  return key === 'colorSaturation'
    ? `${Math.round(current * 100)}%`
    : `${current}${unit}`
}
</script>

<template>
  <UCollapsible class="rounded-lg bg-secondary/5 ring ring-secondary/40">
    <template #default="{ open }">
      <UButton
        block
        color="neutral"
        variant="ghost"
        size="md"
        class="justify-between rounded-lg p-3 text-left"
        :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        :aria-label="`${open ? 'Hide' : 'Edit'} settings for ${name}`"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary ring ring-secondary/20"
          >
            <UIcon :name="productIcon" class="size-4" />
          </span>
          <span class="min-w-0">
            <span class="block truncate font-semibold">{{ name }}</span>
            <span class="block truncate text-xs font-normal text-muted">
              {{ description }}
            </span>
          </span>
        </span>
        <UBadge
          v-if="product?.roomName"
          color="secondary"
          variant="outline"
          icon="i-lucide-map-pin"
          :label="product.roomName"
          class="ml-auto shrink-0 tracking-widest uppercase"
        />
      </UButton>
    </template>

    <template #content>
      <div class="space-y-3 border-t border-secondary/30 p-3 sm:p-4">
        <div v-if="product?.members.length" class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="member in product.members"
            :key="member.id"
            color="neutral"
            variant="subtle"
            icon="i-lucide-package"
            :label="
              [member.name, member.productName, member.roomName]
                .filter(Boolean)
                .join(' · ')
            "
          />
        </div>

        <UFormField
          v-if="product?.canSetPower"
          label="Power"
          :ui="{ root: 'gap-1' }"
        >
          <USelect
            :model-value="
              value('isOn') == null ? 'unchanged' : value('isOn') ? 'on' : 'off'
            "
            :items="[
              { label: 'Do not change power', value: 'unchanged' },
              { label: 'On', value: 'on' },
              { label: 'Off', value: 'off' },
            ]"
            :aria-label="`${name} power in scene`"
            :disabled="disabled"
            size="md"
            icon="i-lucide-power"
            class="w-full sm:w-64"
            @update:model-value="
              setValue('isOn', $event === 'unchanged' ? null : $event === 'on')
            "
          />
        </UFormField>

        <UFormField
          v-for="control in numericControls"
          :key="control.key"
          :label="control.label"
          :description="
            control.key === 'colorTemperature'
              ? `${control.min}–${control.max} K${product?.temperatureRangeReported ? '' : ' (fallback range)'}`
              : undefined
          "
          :ui="{ root: 'gap-1.5' }"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <UiSwitch
                :model-value="value(control.key) != null"
                :mode="control.key === 'lightLevel' ? 'light' : undefined"
                :label="`Set ${control.label.toLowerCase()}`"
                :aria-label="`Set ${control.label.toLowerCase()} for ${name}`"
                :disabled="disabled"
                size="md"
                @update:model-value="
                  setValue(control.key, $event ? control.min : null)
                "
              />
              <UBadge
                :color="value(control.key) == null ? 'neutral' : 'secondary'"
                :variant="value(control.key) == null ? 'soft' : 'subtle'"
                :icon="controlIcons[control.key]"
              >
                {{
                  value(control.key) == null
                    ? 'Not set by this scene'
                    : formattedValue(control.key, control.min, control.unit)
                }}
              </UBadge>
            </div>
            <USlider
              v-if="value(control.key) != null"
              color="secondary"
              :model-value="numericValue(control.key, control.min)"
              :min="control.min"
              :max="control.max"
              :step="control.step"
              :disabled="disabled"
              :aria-label="`${name} ${control.label.toLowerCase()}`"
              @update:model-value="setValue(control.key, $event)"
            />
            <div
              v-if="value(control.key) != null"
              class="flex justify-between text-xs text-muted"
            >
              <span>{{
                formatControlValue(control.key, control.min, control.unit)
              }}</span>
              <span>{{
                formatControlValue(control.key, control.max, control.unit)
              }}</span>
            </div>
          </div>
        </UFormField>

        <UFormField
          v-if="product?.capabilities.includes('playback')"
          label="Playback"
        >
          <USelect
            :model-value="value('playback') ?? 'unchanged'"
            :items="[
              { label: 'Do not change playback', value: 'unchanged' },
              ...playbackOptions,
            ]"
            :disabled="disabled"
            :aria-label="`${name} playback in scene`"
            size="md"
            icon="i-lucide-play"
            class="w-full sm:w-64"
            @update:model-value="
              setValue(
                'playback',
                $event === 'unchanged'
                  ? null
                  : ($event as SceneAttributeEdits['playback'])
              )
            "
          />
        </UFormField>

        <div class="border-t border-default pt-2">
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Remove product"
            size="sm"
            :disabled="disabled"
            :aria-label="`Remove ${name} from scene`"
            @click="emit('remove')"
          />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
