<script setup lang="ts">
const cache = useDirigeraCacheStore()
const { rooms, pending } = storeToRefs(cache)
const activeQuickControlId = ref<string | null>(null)

const quickControlNames = {
  LIGHTS: 'lights',
  OUTLETS: 'outlets',
  SPEAKERS: 'speakers',
} as const

const formatReading = (value: number) => Math.round(value * 10) / 10

async function toggleQuickControl(
  roomId: string,
  control: {
    id: string
    type: keyof typeof quickControlNames
    isOn: boolean | null
  }
) {
  activeQuickControlId.value = control.id
  try {
    await cache.setQuickControl(
      roomId,
      control.type,
      control.isOn == null ? null : !control.isOn
    )
  } finally {
    activeQuickControlId.value = null
  }
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <UCard v-for="room in rooms?.data" :key="room.id">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">{{ room.name }}</h2>
          <UButton
            :to="`/room/${room.id}`"
            color="neutral"
            variant="ghost"
            :aria-label="`Open ${room.name}`"
          >
            Open
          </UButton>
        </div>
      </template>

      <div class="flex flex-wrap gap-2">
        <UBadge
          v-if="room.temperature != null"
          color="neutral"
          variant="outline"
        >
          {{ formatReading(room.temperature) }}°C
        </UBadge>
        <UBadge v-if="room.humidity != null" color="neutral" variant="outline">
          {{ formatReading(room.humidity) }}%
        </UBadge>
        <UBadge v-if="room.pm25 != null" color="neutral" variant="outline">
          PM2.5 {{ formatReading(room.pm25) }}
        </UBadge>
        <UBadge v-if="room.vocIndex != null" color="neutral" variant="outline">
          VOC {{ formatReading(room.vocIndex) }}
        </UBadge>
        <UBadge v-if="room.co2 != null" color="neutral" variant="outline">
          CO2 {{ formatReading(room.co2) }}
        </UBadge>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <UButton
          v-for="control in room.quickControls"
          :key="control.id"
          :color="control.isOn ? 'primary' : 'neutral'"
          :variant="control.isOn ? 'solid' : 'outline'"
          :loading="activeQuickControlId === control.id"
          :aria-label="`Turn ${room.name} ${quickControlNames[control.type]} ${control.isOn ? 'off' : 'on'}`"
          @click="toggleQuickControl(room.id, control)"
        >
          {{ quickControlNames[control.type] }}
        </UButton>
        <span v-if="room.quickControls.length === 0" class="text-sm text-muted">
          No quick controls available
        </span>
      </div>
    </UCard>

    <UCard v-if="pending.rooms">
      <USkeleton class="h-24" />
    </UCard>
  </div>
</template>
