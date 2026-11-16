<script setup lang="ts">
import type { Device } from 'dirigera'

defineProps<{ device: Device }>()
</script>

<template>
  <UModal title="raw Data:" :ui="{ title: 'tracking-widest' }">
    <UButton
      aria-label="Open debug modal"
      icon="i-lucide-wrench"
      size="sm"
      variant="ghost"
      class="text-muted"
    />

    <template #body>
      <small>
        <pre>{{ JSON.stringify(device, null, 2) }}</pre>
      </small>
    </template>
  </UModal>
</template>
