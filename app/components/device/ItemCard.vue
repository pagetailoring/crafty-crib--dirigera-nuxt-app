<script setup lang="ts">
import type { Device } from 'dirigera'
import { getIkeaProductIcon, getIkeaSceneIcon } from '@@/config/ikea-icons'
import type { DeviceAssociations } from '../../services/device-associations'

const { device, associations, scenesAvailable } = defineProps<{
  device: Device
  associations: DeviceAssociations
  scenesAvailable: boolean
}>()

const linkedDevices = computed(() =>
  device.type === 'controller' ? associations.devices : associations.remotes
)
const associationItems = computed(() => {
  if (!['controller', 'light', 'outlet'].includes(device.type)) return []

  return [
    ...(linkedDevices.value.length
      ? [
          {
            label: `${device.type === 'controller' ? 'Controls' : 'Remotes'} (${linkedDevices.value.length})`,
            icon:
              device.type === 'controller'
                ? 'i-lucide-link'
                : 'i-lucide-toggle-left',
            value: 'devices',
            slot: 'devices',
          },
        ]
      : []),
    ...(scenesAvailable && associations.scenes.length
      ? [
          {
            label: `Scenes (${associations.scenes.length})`,
            icon: 'i-lucide-clapperboard',
            value: 'scenes',
            slot: 'scenes',
          },
        ]
      : []),
  ]
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <UIcon :name="getIkeaProductIcon(device)" class="size-5 shrink-0" />
        <span>{{ device.attributes.customName }}</span>
        <span class="ml-auto tracking-widest font-light uppercase">
          {{ device.room?.name }}
        </span>
      </div>
    </template>

    <!-- <template #title>
      <span>title</span>
    </template> -->

    <!-- <template #description>
      <span>description</span>
    </template> -->

    <template #default>
      <div class="flex flex-wrap gap-2 items-center justify-between">
        <UBadge
          v-if="device.attributes.lightLevel != null"
          icon="i-lucide-lightbulb"
          variant="soft"
        >
          {{ device.attributes.lightLevel }}%
        </UBadge>

        <UBadge v-if="device.attributes.isOn != null" variant="soft">
          {{ device.attributes.isOn ? 'On' : 'Off' }}
        </UBadge>

        <UBadge
          v-if="device.capabilities.canReceive.includes('colorTemperature')"
          variant="soft"
        >
          {{ device.attributes.colorTemperatureMin }}-{{
            device.attributes.colorTemperatureMax
          }}
          K
        </UBadge>

        <UBadge
          v-if="device.attributes.colorTemperature != null"
          icon="i-lucide-thermometer-sun"
        >
          {{ device.attributes.colorTemperature }} K
        </UBadge>
      </div>

      <div class="mt-4 flex flex-wrap gap-2 items-center">
        <UBadge icon="i-lucide-cpu" variant="soft" :label="device.deviceType" />
        <UBadge
          v-if="device.attributes.model"
          icon="i-lucide-tag"
          variant="soft"
          :label="device.attributes.model"
        />
        <UBadge
          :icon="device.isReachable ? 'i-lucide-wifi' : 'i-lucide-wifi-off'"
          variant="soft"
          :label="device.isReachable ? 'Online' : 'Offline'"
        />
        <UBadge
          v-if="device.attributes.batteryPercentage != null"
          icon="i-lucide-battery"
          variant="soft"
          :label="`Battery ${device.attributes.batteryPercentage}%`"
        />
        <UBadge
          v-if="device.attributes.isOpen != null"
          icon="i-lucide-door-open"
          variant="soft"
          :label="device.attributes.isOpen ? 'Open' : 'Closed'"
        />
        <UBadge
          v-if="device.attributes.isDetected != null"
          icon="i-lucide-person-standing"
          variant="soft"
          :label="
            device.attributes.isDetected ? 'Motion detected' : 'No motion'
          "
        />
        <UBadge
          v-if="device.attributes.waterLeakDetected != null"
          icon="i-lucide-droplets"
          variant="soft"
          :label="
            device.attributes.waterLeakDetected
              ? 'Water detected'
              : 'No water detected'
          "
        />
        <UBadge
          v-if="device.attributes.currentTemperature != null"
          icon="i-lucide-thermometer"
          variant="soft"
          :label="`${device.attributes.currentTemperature} °C`"
        />
        <UBadge
          v-if="device.attributes.currentRH != null"
          icon="i-lucide-droplet"
          variant="soft"
          :label="`Humidity ${device.attributes.currentRH}%`"
        />
        <UBadge
          v-if="device.attributes.currentPM25 != null"
          icon="i-lucide-wind"
          variant="soft"
          :label="`PM2.5 ${device.attributes.currentPM25} µg/m³`"
        />
        <UBadge
          v-if="device.attributes.currentCO2 != null"
          icon="i-lucide-cloud"
          variant="soft"
          :label="`CO₂ ${device.attributes.currentCO2} ppm`"
        />
        <UBadge
          v-if="device.attributes.vocIndex != null"
          icon="i-lucide-wind"
          variant="soft"
          :label="`VOC index ${device.attributes.vocIndex}`"
        />
        <UBadge
          v-if="device.attributes.illuminance != null"
          icon="i-lucide-sun"
          variant="soft"
          :label="`${device.attributes.illuminance} lx`"
        />
        <UBadge
          v-if="device.attributes.volume != null"
          icon="i-lucide-volume-2"
          variant="soft"
          :label="`Volume ${device.attributes.volume}%`"
        />
        <UBadge
          v-if="device.attributes.isMuted != null"
          icon="i-lucide-volume-x"
          variant="soft"
          :label="device.attributes.isMuted ? 'Muted' : 'Unmuted'"
        />
        <UBadge
          v-if="device.attributes.playback"
          icon="i-lucide-music"
          variant="soft"
          :label="device.attributes.playback.replace('playback', '')"
        />
        <UBadge
          v-if="device.attributes.blindsCurrentLevel != null"
          icon="i-lucide-blinds"
          variant="soft"
          :label="`Position ${device.attributes.blindsCurrentLevel}%`"
        />
      </div>

      <UAccordion
        v-if="associationItems.length"
        :items="associationItems"
        class="mt-4 border-t border-default pt-2"
      >
        <template #devices-body>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="linked in linkedDevices"
              :key="linked.id"
              :icon="getIkeaProductIcon(linked)"
              color="neutral"
              variant="subtle"
              :label="linked.attributes.customName"
            />
          </div>
        </template>
        <template #scenes-body>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="scene in associations.scenes"
              :key="scene.id"
              :icon="getIkeaSceneIcon(scene.info.icon)"
              color="neutral"
              variant="subtle"
              :label="scene.info.name"
            />
          </div>
        </template>
      </UAccordion>
    </template>

    <template #footer>
      <!-- <span>footer</span> -->
      <details>
        <summary>
          <small class="text-muted cursor-pointer"
            >Details <i>raw data</i></small
          >
        </summary>
        <small>
          <pre>{{ JSON.stringify(device, null, 2) }}</pre>
        </small>
      </details>
    </template>
  </UCard>
</template>
