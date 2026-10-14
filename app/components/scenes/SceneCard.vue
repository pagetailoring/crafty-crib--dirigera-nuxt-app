<script setup lang="ts">
import type { Scene } from 'dirigera'
import type {
  SceneActionEdit,
  SceneDaysEdit,
  SceneProduct,
} from '../../../shared/types/scene-editor'
import { WEEKDAYS } from '../../../config/scene'

type Trigger = NonNullable<Scene['triggers']>[number]

const props = defineProps<{ scene: Scene; products: SceneProduct[] }>()
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
      if (!product.canSetPower) return false
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
      label: `${product.name}${product.roomName ? ` · ${product.roomName}` : ''}`,
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

function otherAttributes(action: Scene['actions'][number]) {
  return Object.entries(action.attributes)
    .filter(([key, value]) => key !== 'isOn' && value != null)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    )
}

function beginEdit() {
  draftActions.value = props.scene.actions.map((action, index) => ({
    kind: 'existing',
    index,
    ...(typeof action.attributes.isOn === 'boolean'
      ? { isOn: action.attributes.isOn }
      : {}),
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
  if (!product?.canSetPower) return
  draftActions.value.push({
    kind: 'new',
    type: product.type,
    deviceId: product.id,
    isOn: selectedPower.value,
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

function canEditPower(action: SceneActionEdit) {
  if (action.kind === 'new') return true
  const original = props.scene.actions[action.index]
  return original ? (productFor(original)?.canSetPower ?? false) : false
}

function draftPower(action: SceneActionEdit) {
  if (action.kind === 'new') return action.isOn
  if (action.isOn !== undefined) return action.isOn
  return props.scene.actions[action.index]?.attributes.isOn === true
}

function setDraftPower(index: number, isOn: boolean) {
  const action = draftActions.value[index]
  if (action) action.isOn = isOn
}

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
  <UCard class="h-fit">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <UIcon name="i-lucide-sparkles" class="size-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold">{{ scene.info.name }}</h2>
            <p class="text-sm text-muted">
              {{ scene.actions.length }} products ·
              {{ scene.triggers?.length ?? 0 }} triggers
            </p>
          </div>
        </div>
        <UBadge color="neutral" variant="subtle">{{ scene.type }}</UBadge>
      </div>
    </template>

    <div class="space-y-6">
      <section>
        <h3 class="mb-3 flex items-center gap-2 font-medium">
          <UIcon name="i-lucide-lightbulb" class="size-4 text-muted" />
          Products
        </h3>
        <p v-if="scene.actions.length === 0" class="text-sm text-muted">
          No products in this scene.
        </p>
        <div class="space-y-2">
          <div
            v-for="(action, index) in scene.actions"
            :key="action.id ?? index"
            class="rounded-lg border border-default p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">{{ actionName(action) }}</p>
                <p
                  v-if="productFor(action)?.productName"
                  class="text-xs text-muted"
                >
                  {{ productFor(action)?.productName }}
                </p>
              </div>
              <UBadge
                v-if="typeof action.attributes.isOn === 'boolean'"
                :color="action.attributes.isOn ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ action.attributes.isOn ? 'Turns on' : 'Turns off' }}
              </UBadge>
            </div>
            <div
              v-if="otherAttributes(action).length"
              class="mt-2 flex flex-wrap gap-1"
            >
              <UBadge
                v-for="attribute in otherAttributes(action)"
                :key="attribute"
                color="neutral"
                variant="outline"
              >
                {{ attribute }}
              </UBadge>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 class="mb-3 flex items-center gap-2 font-medium">
          <UIcon name="i-lucide-calendar-days" class="size-4 text-muted" />
          Schedule and triggers
        </h3>
        <p v-if="!scene.triggers?.length" class="text-sm text-muted">
          No scheduled triggers.
        </p>
        <div class="space-y-2">
          <div
            v-for="(trigger, index) in scene.triggers"
            :key="trigger.id ?? index"
            class="rounded-lg bg-muted/40 p-3 text-sm"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">{{ triggerLabel(trigger) }}</span>
              <UBadge v-if="trigger.disabled" color="warning" variant="subtle">
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
                variant="outline"
              >
                {{ day }}
              </UBadge>
            </div>
          </div>
        </div>
      </section>

      <p v-if="scene.commands.length" class="text-sm text-muted">
        {{ scene.commands.length }} additional commands. This scene is read-only
        here; the debug view shows the commands.
      </p>
      <p v-else-if="scene.type !== 'userScene'" class="text-sm text-muted">
        This scene type is read-only here.
      </p>

      <div v-if="editing" class="space-y-5 border-t border-default pt-5">
        <h3 class="font-semibold">Edit scene</h3>
        <div class="space-y-2">
          <h4 class="text-sm font-medium">Products in the scene</h4>
          <div
            v-for="(action, index) in draftActions"
            :key="
              action.kind === 'existing'
                ? `existing-${action.index}`
                : `${action.type}-${action.deviceId}`
            "
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default p-3"
          >
            <span class="font-medium">{{ draftActionName(action) }}</span>
            <div class="flex items-center gap-3">
              <USwitch
                v-if="canEditPower(action)"
                :model-value="draftPower(action)"
                :label="draftPower(action) ? 'On' : 'Off'"
                :aria-label="`Turn ${draftActionName(action)} ${draftPower(action) ? 'off' : 'on'} in scene`"
                @update:model-value="setDraftPower(index, $event)"
              />
              <UButton
                size="sm"
                color="error"
                variant="ghost"
                :aria-label="`Remove ${draftActionName(action)} from scene`"
                @click="draftActions.splice(index, 1)"
              >
                Remove
              </UButton>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 pt-2">
            <USelect
              v-model="selectedProductKey"
              :items="productOptions"
              placeholder="Select a product"
              aria-label="Product to add"
              class="min-w-52 flex-1"
            />
            <USwitch
              v-model="selectedPower"
              :label="selectedPower ? 'On' : 'Off'"
              aria-label="Power for new product"
            />
            <UButton
              color="neutral"
              variant="outline"
              :disabled="!selectedProductKey"
              aria-label="Add selected product to scene"
              @click="addProduct"
            >
              Add product
            </UButton>
          </div>
        </div>

        <div v-if="draftDays.length" class="space-y-3">
          <h4 class="text-sm font-medium">Days in existing schedules</h4>
          <div
            v-for="edit in draftDays"
            :key="edit.index"
            class="rounded-lg border border-default p-3"
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
                @click="toggleDay(edit, day)"
              >
                {{ day }}
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            :loading="saving"
            :aria-label="`Save changes to ${scene.info.name}`"
            @click="save"
            >Save changes</UButton
          >
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="saving"
            @click="editing = false"
          >
            Cancel
          </UButton>
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

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-xs text-muted">
          {{
            scene.lastTriggered
              ? `Last run ${new Date(scene.lastTriggered).toLocaleString()}`
              : 'Not run yet'
          }}
        </span>
        <div class="flex gap-2">
          <UButton
            v-if="canEdit && !editing"
            color="neutral"
            variant="outline"
            :aria-label="`Edit ${scene.info.name}`"
            @click="beginEdit"
          >
            Edit
          </UButton>
          <UButton
            :loading="testing"
            :aria-label="`Test ${scene.info.name}`"
            @click="testScene"
          >
            Test scene
          </UButton>
        </div>
      </div>
    </template>
  </UCard>
</template>
