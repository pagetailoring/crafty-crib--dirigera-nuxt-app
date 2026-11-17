<script setup lang="ts">
const { power: powerLevel } = defineProps<{ power: number }>()

const color = computed(() =>
  powerLevel < 3 ? 'error' : powerLevel < 15 ? 'warning' : 'primary'
)
</script>

<template>
  <div>
    <UTooltip :text="`${powerLevel}%`">
      <UProgress :model-value="powerLevel" :color size="sm" />
    </UTooltip>
  </div>
</template>
