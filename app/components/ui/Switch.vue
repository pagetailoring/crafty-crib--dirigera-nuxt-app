<script setup lang="ts" generic="T = boolean">
import type { SwitchEmits, SwitchSlots } from '@nuxt/ui'
import type { DeviceSwitchProps } from '~/types/device-switch'
import { useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DeviceSwitchProps<T>>()
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

const forwarded = useForwardPropsEmits((): DeviceSwitchProps<T> => props, emit)
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
