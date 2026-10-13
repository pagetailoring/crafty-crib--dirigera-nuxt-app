<script setup lang="ts">
const dirigera = useDirigera()

const { data, error, status } = await useAsyncData('home', async () => {
  const [scenes, rooms] = await Promise.all([
    dirigera.listScenes(),
    dirigera.listRooms(),
  ])
  return { scenes, rooms }
})

const formatReading = (value: number) => Math.round(value * 10) / 10
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="scene in data?.scenes"
        :key="scene.id"
        color="neutral"
        variant="outline"
      >
        {{ scene.name }}
      </UButton>
      <USkeleton v-if="status === 'pending'" class="h-8 w-24" />
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Unable to load the home"
      :description="error.message"
    />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <UCard v-for="room in data?.rooms" :key="room.id">
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
          <UBadge
            v-if="room.humidity != null"
            color="neutral"
            variant="outline"
          >
            {{ formatReading(room.humidity) }}%
          </UBadge>
          <UBadge v-if="room.pm25 != null" color="neutral" variant="outline">
            PM2.5 {{ formatReading(room.pm25) }}
          </UBadge>
          <UBadge
            v-if="room.vocIndex != null"
            color="neutral"
            variant="outline"
          >
            VOC {{ formatReading(room.vocIndex) }}
          </UBadge>
          <UBadge v-if="room.co2 != null" color="neutral" variant="outline">
            CO2 {{ formatReading(room.co2) }}
          </UBadge>
        </div>
      </UCard>

      <UCard v-if="status === 'pending'">
        <USkeleton class="h-24" />
      </UCard>
    </div>
  </div>
</template>
