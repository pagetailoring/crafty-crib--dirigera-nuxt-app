<script setup lang="ts" generic="T = boolean">
import type { SwitchEmits, SwitchProps, SwitchSlots } from '@nuxt/ui'
import { useForwardPropsEmits } from 'reka-ui'

interface Props extends SwitchProps<T> {
  /**
   * Custom icon variants for switching devices on and off:
   * - `light`: lights.
   * - `power`: other electrical devices.
   * Omitting the mode preserves the default Nuxt UI switch behavior.
   */
  mode?: 'power' | 'light'
}

const props = defineProps<Props>()
const emit = defineEmits<SwitchEmits<T>>()
const slots = defineSlots<SwitchSlots>()
defineOptions({ inheritAttrs: false })

const icons = {
  power: {
    checkedIcon: 'i-lucide-power',
    uncheckedIcon: 'i-lucide-power-off',
  },
  light: {
    checkedIcon: 'i-lucide-lightbulb',
    uncheckedIcon: 'i-lucide-lightbulb-off',
  },
}

const forwarded = useForwardPropsEmits((): Props => props, emit)
const switchProps = computed(() => {
  const { mode, ...rest } = forwarded.value
  return { ...(mode ? icons[mode] : {}), ...rest }
})
</script>

<template>
  <USwitch v-bind="{ ...switchProps, ...$attrs }">
    <template v-if="slots.label" #label="slotProps">
      <slot name="label" v-bind="slotProps" />
    </template>
    <template v-if="slots.description" #description="slotProps">
      <slot name="description" v-bind="slotProps" />
    </template>
  </USwitch>
</template>
