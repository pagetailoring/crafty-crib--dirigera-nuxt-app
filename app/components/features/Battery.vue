<script setup lang="ts">
const { power } = defineProps<{ power: number }>()

const color = computed(() =>
  power < 3 ? 'error' : power < 15 ? 'warning' : 'primary'
)
</script>

<template>
  <div>
    <UTooltip :text="`${power}%`">
      <UProgress :model-value="power" :color size="sm" />
    </UTooltip>
  </div>
</template>

<!-- <UBadge
          v-if="device.attributes.batteryPercentage != null"
          icon="i-lucide-battery"
          variant="soft"
          :label="`Battery ${device.attributes.batteryPercentage}%`"
        /> -->
