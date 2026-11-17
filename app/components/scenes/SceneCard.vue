<script setup lang="ts">
import type { Scene } from 'dirigera'
import { WEEKDAYS } from '@@/config/scene'
import { sceneNumericControl } from '@@/config/scene-controls'
import type { SceneNumericAttribute } from '@@/config/scene-controls'
import { getIkeaSceneIcon } from '@@/config/ikea-icons'

import type { Trigger } from '~/types/scene-card'

const props = defineProps<{
  scene: Scene
  products: SceneProduct[]
  showDetailsLink?: boolean
}>()
const emit = defineEmits<{ updated: [scene: Scene] }>()
const details = useSceneDetails()
const dirigera = useDirigera()
const editing = ref(false)
const saving = ref(false)
const testing = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const draftActions = ref<SceneActionEdit[]>([])
const draftDays = ref<SceneDaysEdit[]>([])
const selectedProductKey = ref<string | undefined>()
const selectedPower = ref(true)

const canEdit = computed(
  () => props.scene.type === 'userScene' && props.scene.commands.length === 0
)

function productFor(action: Scene['actions'][number]) {
  return props.products.find(
    product => product.type === action.type && product.id === action.deviceId
  )
}

function actionName(action: Scene['actions'][number]) {
  return productFor(action)?.name ?? action.deviceId ?? 'Unknown product'
}

const productOptions = computed(() =>
  props.products
    .filter(product => {
      if (!product.capabilities.length) return false
      return !draftActions.value.some(action => {
        if (action.kind === 'new') {
          return action.type === product.type && action.deviceId === product.id
        }
        const existing = props.scene.actions[action.index]
        return (
          existing?.type === product.type && existing.deviceId === product.id
        )
      })
    })
    .map(product => ({
      label: [
        product.name,
        product.productName,
        product.roomName,
        product.type === 'deviceSet' ? 'Group' : undefined,
        ...product.groups.map(group => `Group: ${group.name}`),
      ]
        .filter(Boolean)
        .join(' · '),
      value: `${product.type}:${product.id}`,
    }))
)

function hasEditableDays(trigger: Trigger) {
  return (
    'trigger' in trigger &&
    (trigger.type === 'time' || 'days' in trigger.trigger)
  )
}

function triggerDays(trigger: Trigger): string[] {
  if (!('trigger' in trigger) || !('days' in trigger.trigger)) {
    return [...WEEKDAYS]
  }
  return trigger.trigger.days ?? [...WEEKDAYS]
}

function triggerLabel(trigger: Trigger | undefined) {
  if (!trigger) return 'Schedule'
  if (trigger.type === 'time') return `At ${trigger.trigger.time}`
  if (trigger.type === 'sunriseSunset') {
    return trigger.trigger.type === 'sunrise' ? 'At sunrise' : 'At sunset'
  }
  if (trigger.type === 'app') return 'From the app'
  if (trigger.type === 'controller') return 'From a controller'
  if (trigger.type === 'event') return 'Device event'
  return 'Trigger'
}

function triggerIcon(trigger: Trigger) {
  if (trigger.type === 'time') return 'i-lucide-clock-3'
  if (trigger.type === 'sunriseSunset') {
    return trigger.trigger.type === 'sunrise'
      ? 'i-lucide-sunrise'
      : 'i-lucide-sunset'
  }
  if (trigger.type === 'app') return 'i-lucide-smartphone'
  if (trigger.type === 'controller') return 'i-lucide-toggle-left'
  if (trigger.type === 'event') return 'i-lucide-zap'
  return 'i-lucide-calendar-clock'
}

const attributePresentation = {
  lightLevel: { label: 'Brightness', icon: 'i-lucide-lightbulb', suffix: '%' },
  colorTemperature: {
    label: 'Color temperature',
    icon: 'i-lucide-thermometer-sun',
    suffix: ' K',
  },
  colorHue: { label: 'Hue', icon: 'i-lucide-palette', suffix: '°' },
  colorSaturation: {
    label: 'Saturation',
    icon: 'i-lucide-droplets',
    suffix: '',
  },
  volume: { label: 'Volume', icon: 'i-lucide-volume-2', suffix: '%' },
  playback: { label: 'Playback', icon: 'i-lucide-play', suffix: '' },
} as const

function otherAttributes(action: Scene['actions'][number]) {
  return Object.entries(action.attributes)
    .filter(([key, value]) => key !== 'isOn' && value != null)
    .map(([key, value]) => {
      const presentation =
        attributePresentation[key as keyof typeof attributePresentation]
      const formattedValue =
        key === 'colorSaturation' && typeof value === 'number'
          ? `${Math.round(value * 100)}%`
          : `${typeof value === 'object' ? JSON.stringify(value) : value}${presentation?.suffix ?? ''}`
      return {
        key,
        label: presentation?.label ?? key,
        icon: presentation?.icon ?? 'i-lucide-sliders-horizontal',
        value: formattedValue,
      }
    })
}

function beginEdit() {
  draftActions.value = props.scene.actions.map((_, index) => ({
    kind: 'existing',
    index,
    attributes: {},
  }))
  draftDays.value = (props.scene.triggers ?? []).flatMap((trigger, index) =>
    hasEditableDays(trigger) ? [{ index, days: triggerDays(trigger) }] : []
  )
  selectedProductKey.value = undefined
  error.value = null
  success.value = null
  editing.value = true
}

function addProduct() {
  const product = props.products.find(
    item => `${item.type}:${item.id}` === selectedProductKey.value
  )
  if (!product?.capabilities.length) return
  const first = product.capabilities[0]!
  const attributes = product.canSetPower
    ? { isOn: selectedPower.value }
    : first === 'playback'
      ? { playback: 'playbackPlaying' as const }
      : {
          [first]: sceneNumericControl(first as SceneNumericAttribute, product)
            .min,
        }
  draftActions.value.push({
    kind: 'new',
    type: product.type,
    deviceId: product.id,
    attributes,
  })
  selectedProductKey.value = undefined
  selectedPower.value = true
}

function draftActionName(action: SceneActionEdit) {
  if (action.kind === 'existing') {
    const original = props.scene.actions[action.index]
    return original ? actionName(original) : 'Unknown product'
  }
  return (
    props.products.find(
      product => product.type === action.type && product.id === action.deviceId
    )?.name ?? action.deviceId
  )
}

function draftProduct(action: SceneActionEdit) {
  return action.kind === 'existing'
    ? productFor(props.scene.actions[action.index]!)
    : props.products.find(
        product =>
          product.type === action.type && product.id === action.deviceId
      )
}

const selectedProduct = computed(() =>
  props.products.find(
    product => `${product.type}:${product.id}` === selectedProductKey.value
  )
)

function toggleDay(edit: SceneDaysEdit, day: string) {
  edit.days = edit.days.includes(day)
    ? edit.days.filter(item => item !== day)
    : WEEKDAYS.filter(item => item === day || edit.days.includes(item))
}

async function save() {
  if (draftDays.value.some(edit => edit.days.length === 0)) {
    error.value = 'Select at least one day for each schedule.'
    return
  }
  saving.value = true
  error.value = null
  try {
    const updated = await details.updateScene(props.scene.id, {
      expectedActions: props.scene.actions,
      expectedTriggers: props.scene.triggers,
      actions: draftActions.value,
      days: draftDays.value,
    })
    emit('updated', updated)
    editing.value = false
    success.value = 'Scene saved.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    saving.value = false
  }
}

async function testScene() {
  testing.value = true
  error.value = null
  success.value = null
  try {
    await dirigera.activateScene(props.scene.id)
    success.value = 'Scene triggered.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <UCard
    class="h-fit overflow-hidden"
    :ui="{ header: 'p-4', body: 'p-4', footer: 'p-4' }"
  >
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div
            class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring ring-primary/20"
          >
            <UIcon :name="getIkeaSceneIcon(scene.info.icon)" class="size-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold">{{ scene.info.name }}</h2>
            <p class="text-sm text-muted">
              {{ scene.actions.length }} products ·
              {{ scene.triggers?.length ?? 0 }} triggers
            </p>
          </div>
        </div>
        <UBadge
          color="neutral"
          icon="i-lucide-clapperboard"
          :label="scene.type"
        />
      </div>
    </template>

    <div class="space-y-4">
      <section v-if="!editing">
        <h3 class="mb-2 flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-lightbulb" class="size-5 text-secondary" />
          Products
          <UBadge color="secondary" :label="scene.actions.length" />
        </h3>
        <p v-if="scene.actions.length === 0" class="text-sm text-muted">
          No products in this scene.
        </p>
        <div class="space-y-2">
          <div
            v-for="(action, index) in scene.actions"
            :key="action.id ?? index"
            class="rounded-lg bg-secondary/5 p-3 ring ring-secondary/30"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium">{{ actionName(action) }}</p>
                <p v-if="productFor(action)" class="text-xs text-muted">
                  {{
                    [
                      productFor(action)?.productName,
                      ...(productFor(action)?.groups.map(
                        group => `Group: ${group.name}`
                      ) ?? []),
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <UBadge
                  v-if="productFor(action)?.roomName"
                  color="secondary"
                  variant="outline"
                  icon="i-lucide-map-pin"
                  :label="productFor(action)?.roomName ?? undefined"
                  class="tracking-widest uppercase"
                />
                <UBadge
                  v-if="typeof action.attributes.isOn === 'boolean'"
                  :color="action.attributes.isOn ? 'success' : 'neutral'"
                  :icon="
                    action.attributes.isOn
                      ? 'i-lucide-lightbulb'
                      : 'i-lucide-lightbulb-off'
                  "
                >
                  {{ action.attributes.isOn ? 'Turns on' : 'Turns off' }}
                </UBadge>
              </div>
            </div>
            <div
              v-if="otherAttributes(action).length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="attribute in otherAttributes(action)"
                :key="attribute.key"
                color="secondary"
                variant="subtle"
                :icon="attribute.icon"
              >
                {{ attribute.label }} {{ attribute.value }}
              </UBadge>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!editing">
        <h3 class="mb-2 flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-calendar-days" class="size-5 text-secondary" />
          Schedule and triggers
          <UBadge
            color="secondary"
            variant="subtle"
            :label="scene.triggers?.length ?? 0"
          />
        </h3>
        <p v-if="!scene.triggers?.length" class="text-sm text-muted">
          No scheduled triggers.
        </p>
        <div class="space-y-2">
          <div
            v-for="(trigger, index) in scene.triggers"
            :key="trigger.id ?? index"
            class="rounded-lg bg-elevated/50 p-3 text-sm ring ring-default"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="flex items-center gap-2 font-medium">
                <UIcon :name="triggerIcon(trigger)" class="size-4 text-muted" />
                {{ triggerLabel(trigger) }}
              </span>
              <UBadge v-if="trigger.disabled" color="warning">
                Disabled
              </UBadge>
            </div>
            <div
              v-if="hasEditableDays(trigger)"
              class="mt-2 flex flex-wrap gap-1"
            >
              <UBadge
                v-for="day in triggerDays(trigger)"
                :key="day"
                color="neutral"
                icon="i-lucide-calendar-check"
              >
                {{ day }}
              </UBadge>
            </div>
          </div>
        </div>
      </section>

      <p v-if="!editing && scene.commands.length" class="text-sm text-muted">
        {{ scene.commands.length }} additional commands. This scene is read-only
        here; the debug view shows the commands.
      </p>
      <p
        v-else-if="!editing && scene.type !== 'userScene'"
        class="text-sm text-muted"
      >
        This scene type is read-only here.
      </p>

      <div
        v-if="editing"
        class="space-y-4 rounded-xl bg-elevated/40 p-3 ring ring-default"
      >
        <h3 class="flex items-center gap-2 font-semibold">
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="size-5 text-primary"
          />
          Edit scene
        </h3>
        <div class="space-y-2.5">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-lucide-package-plus" class="size-4" />
            Products in the scene
          </h4>
          <ScenesActionEditor
            v-for="(action, index) in draftActions"
            :key="
              action.kind === 'existing'
                ? `existing-${action.index}`
                : `${action.type}-${action.deviceId}`
            "
            :model-value="action.attributes ?? {}"
            :name="draftActionName(action)"
            :product="draftProduct(action)"
            :original="
              action.kind === 'existing'
                ? scene.actions[action.index]?.attributes
                : undefined
            "
            :disabled="saving"
            @update:model-value="action.attributes = $event"
            @remove="draftActions.splice(index, 1)"
          />
          <div
            class="flex flex-wrap items-center gap-2 rounded-lg bg-default p-3 ring ring-default"
          >
            <USelect
              v-model="selectedProductKey"
              :items="productOptions"
              :disabled="saving"
              placeholder="Select a product"
              aria-label="Product to add"
              class="min-w-52 flex-1"
            />
            <UiSwitch
              v-if="selectedProduct?.canSetPower"
              v-model="selectedPower"
              :disabled="saving"
              :label="selectedPower ? 'On' : 'Off'"
              aria-label="Power for new product"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-plus"
              label="Add product"
              :disabled="saving || !selectedProductKey"
              aria-label="Add selected product to scene"
              @click="addProduct"
            />
          </div>
        </div>

        <div v-if="draftDays.length" class="space-y-3">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-lucide-calendar-cog" class="size-4" />
            Days in existing schedules
          </h4>
          <div
            v-for="edit in draftDays"
            :key="edit.index"
            class="rounded-lg bg-default p-3 ring ring-default"
          >
            <p class="mb-2 text-sm font-medium">
              {{ triggerLabel(scene.triggers?.[edit.index]) }}
            </p>
            <div class="flex flex-wrap gap-1">
              <UButton
                v-for="day in WEEKDAYS"
                :key="day"
                size="sm"
                :color="edit.days.includes(day) ? 'primary' : 'neutral'"
                :variant="edit.days.includes(day) ? 'solid' : 'outline'"
                :aria-label="`${day} for schedule ${edit.index + 1}`"
                :aria-pressed="edit.days.includes(day)"
                :disabled="saving"
                @click="toggleDay(edit, day)"
              >
                {{ day }}
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            variant="subtle"
            icon="i-lucide-save"
            label="Save changes"
            :loading="saving"
            :aria-label="`Save changes to ${scene.info.name}`"
            @click="save"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            label="Cancel"
            :disabled="saving"
            @click="editing = false"
          />
        </div>
      </div>

      <UAlert
        v-if="error"
        color="error"
        title="Scene request failed"
        :description="error"
      />
      <UAlert v-if="success" color="success" :title="success" />
    </div>

    <template v-if="!editing" #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-history" class="size-4" />
          {{
            scene.lastTriggered
              ? `Last run ${new Date(scene.lastTriggered).toLocaleString()}`
              : 'Not run yet'
          }}
        </span>
        <div class="flex gap-2">
          <UButton
            v-if="showDetailsLink"
            :to="`/scenes/${encodeURIComponent(scene.id)}`"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-up-right"
            label="Details"
            :aria-label="`Open ${scene.info.name}`"
          />
          <UButton
            v-if="canEdit && !editing"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            label="Edit"
            :aria-label="`Edit ${scene.info.name}`"
            @click="beginEdit"
          />
          <UButton
            color="primary"
            icon="i-lucide-play"
            label="Test scene"
            :loading="testing"
            :aria-label="`Test ${scene.info.name}`"
            @click="testScene"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
