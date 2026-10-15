<script setup lang="ts">
import type { Device } from 'dirigera'
import { getIkeaProductIcon, getIkeaSceneIcon } from '@@/config/ikea-icons'
import type { DeviceAssociations } from '../../services/device-associations'
import { getDeviceCategory } from '../../utils/device-categories'

const { device, associations, scenesAvailable } = defineProps<{
  device: Device
  associations: DeviceAssociations
  scenesAvailable: boolean
}>()

const dirigera = useDirigera()
const cache = useDirigeraCacheStore()
const toast = useToast()
const power = ref(device.attributes.isOn)
const powerPending = ref(false)
const isOpen = ref(false)
const category = computed(() => getDeviceCategory(device.type))
const hasLightControls = computed(
  () =>
    device.type === 'light' &&
    ['lightLevel', 'colorTemperature', 'colorHue', 'colorSaturation'].some(
      capability => device.capabilities.canReceive.includes(capability)
    )
)

watch(
  () => device.attributes.isOn,
  value => {
    if (!powerPending.value) power.value = value
  }
)

async function setPower(isOn: boolean) {
  if (powerPending.value || !device.isReachable) return

  const previous = power.value
  power.value = isOn
  powerPending.value = true
  try {
    await dirigera.controlDevice(device.id, 'DEVICE', {
      type: 'setIsOn',
      isOn,
    })
    cache.invalidateAll()
    void refreshNuxtData('/api/dirigera/devices').catch(error =>
      console.error('Unable to refresh devices', error)
    )
  } catch {
    power.value = previous
    toast.add({
      title: `Unable to turn ${device.attributes.customName} ${isOn ? 'on' : 'off'}`,
      color: 'error',
    })
  } finally {
    powerPending.value = false
  }
}

const linkedDevices = computed(() =>
  device.type === 'controller' ? associations.devices : associations.remotes
)
const associationItems = computed(() => {
  if (!['controller', 'light', 'outlet'].includes(device.type)) return []

  return [
    ...(linkedDevices.value.length
      ? [
          {
            label: `${device.type === 'controller' ? 'Controls' : 'Remotes'}`,
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
            label: ` Scenes`,
            icon: 'i-lucide-clapperboard',
            value: 'scenes',
            slot: 'scenes',
          },
        ]
      : []),
  ]
})
</script>

<!--  :spotlight="true" -->

<template>
  <UPageCard :variant="category?.variant">
    <template #header>
      <UIcon :name="getIkeaProductIcon(device)" class="size-5 m-0.5 ml-0" />
      <span>{{ device.attributes.customName }}</span>

      <div class="row-span-2 relative">
        <span class="ml-auto tracking-widest font-light uppercase text-sm">
          {{ device.room?.name }}
        </span>
        <span class="absolute bottom-0 max-h-[50%] w-full left-0">
          <FeaturesBattery
            v-if="device.attributes.batteryPercentage != null"
            :power="device.attributes.batteryPercentage"
          />
        </span>
      </div>
      <span class="text-muted text-xs col-start-2">
        {{ device.attributes.model }}
      </span>

      <UCollapsible
        v-if="hasLightControls"
        v-model:open="isOpen"
        class="col-span-full"
      >
        <template #content>
          <DeviceLightControls :device :disabled="!power" />
        </template>
      </UCollapsible>
    </template>

    <template #body>
      <UBadge
        v-if="
          device.attributes.batteryPercentage != null &&
          device.attributes.batteryPercentage < 15
        "
        icon="i-lucide-battery"
        :label="`${device.attributes.batteryPercentage}%`"
      />

      <DevOnly>
        <!-- dev -->
        <LazyToolsDeviceDebug
          :device
          class="absolute left-1.5 opacity-15 hover:opacity-100"
        />
        <!--  -->
      </DevOnly>

      <UTooltip
        v-if="device.type === 'light' && device.attributes.lightLevel != null"
        text="Set brightness"
        :disabled="!hasLightControls || !power || isOpen"
      >
        <UButton
          icon="i-lucide-lightbulb"
          variant="subtle"
          size="xs"
          :color="power ? 'primary' : 'secondary'"
          :label="`${device.attributes.lightLevel}%`"
          :disabled="!hasLightControls || !power"
          :aria-expanded="isOpen"
          :aria-label="`Adjust ${device.attributes.customName} brightness`"
          @click="isOpen = !isOpen"
        />
      </UTooltip>

      <UiSwitch
        v-if="
          (device.type === 'light' || device.type === 'outlet') && power != null
        "
        :mode="device.type === 'light' ? 'light' : 'power'"
        :model-value="power"
        :disabled="!device.isReachable"
        :loading="powerPending"
        :aria-label="`Turn ${device.attributes.customName} ${power ? 'off' : 'on'}`"
        @update:model-value="setPower(Boolean($event))"
      />
      <UBadge v-else-if="device.attributes.isOn != null">
        {{ device.attributes.isOn ? 'On' : 'Off' }}
      </UBadge>

      <UBadge
        v-if="device.capabilities.canReceive.includes('colorTemperature')"
      >
        {{ device.attributes.colorTemperatureMin }}-{{
          device.attributes.colorTemperatureMax
        }}
        K
      </UBadge>

      <UTooltip
        v-if="
          device.type === 'light' && device.attributes.colorTemperature != null
        "
        text="Set color temperature"
        :disabled="!hasLightControls || !power || isOpen"
      >
        <UButton
          icon="i-lucide-thermometer-sun"
          variant="subtle"
          size="xs"
          :color="power ? 'primary' : 'secondary'"
          :label="`${device.attributes.colorTemperature} K`"
          :disabled="!hasLightControls || !power"
          :aria-expanded="isOpen"
          :aria-label="`Adjust ${device.attributes.customName} color temperature`"
          @click="isOpen = !isOpen"
        />
      </UTooltip>

      <UBadge
        v-if="!device.isReachable"
        color="neutral"
        size="lg"
        :icon="device.isReachable ? 'i-lucide-wifi' : 'i-lucide-wifi-off'"
        :label="device.isReachable ? 'Online' : 'Offline'"
      />

      <UBadge
        v-if="device.attributes.isOpen != null"
        icon="i-lucide-door-open"
        :label="device.attributes.isOpen ? 'Open' : 'Closed'"
      />
      <UBadge
        v-if="device.attributes.isDetected != null"
        icon="i-lucide-person-standing"
        :label="device.attributes.isDetected ? 'Motion detected' : 'No motion'"
      />
      <UBadge
        v-if="device.attributes.waterLeakDetected != null"
        icon="i-lucide-droplets"
        :label="
          device.attributes.waterLeakDetected
            ? 'Water detected'
            : 'No water detected'
        "
      />
      <UBadge
        v-if="device.attributes.currentTemperature != null"
        icon="i-lucide-thermometer"
        :label="`${device.attributes.currentTemperature} °C`"
      />
      <UBadge
        v-if="device.attributes.currentRH != null"
        icon="i-lucide-droplet"
        :label="`Humidity ${device.attributes.currentRH}%`"
      />
      <UBadge
        v-if="device.attributes.currentPM25 != null"
        icon="i-lucide-wind"
        :label="`PM2.5 ${device.attributes.currentPM25} µg/m³`"
      />
      <UBadge
        v-if="device.attributes.currentCO2 != null"
        icon="i-lucide-cloud"
        :label="`CO₂ ${device.attributes.currentCO2} ppm`"
      />
      <UBadge
        v-if="device.attributes.vocIndex != null"
        icon="i-lucide-wind"
        :label="`VOC index ${device.attributes.vocIndex}`"
      />
      <UBadge
        v-if="device.attributes.illuminance != null"
        icon="i-lucide-sun"
        :label="`${device.attributes.illuminance} lx`"
      />
      <UBadge
        v-if="device.attributes.volume != null"
        icon="i-lucide-volume-2"
        :label="`Volume ${device.attributes.volume}%`"
      />
      <UBadge
        v-if="device.attributes.isMuted != null"
        icon="i-lucide-volume-x"
        :label="device.attributes.isMuted ? 'Muted' : 'Unmuted'"
      />
      <UBadge
        v-if="device.attributes.playback"
        icon="i-lucide-music"
        :label="device.attributes.playback.replace('playback', '')"
      />
      <UBadge
        v-if="device.attributes.blindsCurrentLevel != null"
        icon="i-lucide-blinds"
        :label="`Position ${device.attributes.blindsCurrentLevel}%`"
      />
    </template>

    <template #footer>
      <UCollapsible v-if="associationItems.length">
        <UButton
          icon="i-lucide-link"
          variant="ghost"
          size="xs"
          :trailing-icon="category?.icon"
          class="font-light text-center tracking-widest text-muted"
          block
          :ui="{
            trailingIcon: 'size-5 ms-1 -mr-2 opacity-50',
            leadingIcon: '-ms-2 mr-3 opacity-50',
          }"
        >
          <USeparator
            :label="`${category?.singularLabel ?? 'device'} connected to`"
            :ui="{
              container: 'font-light text-muted',
              label: 'text-xs tracking-normal',
            }"
          />
        </UButton>

        <template #content>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="linked in linkedDevices"
              :key="linked.id"
              :icon="getIkeaProductIcon(linked)"
              :label="linked.attributes.customName"
            />
            <UButton
              v-for="scene in associations.scenes"
              :key="scene.id"
              :to="`/scenes/${encodeURIComponent(scene.id)}`"
              :icon="getIkeaSceneIcon(scene.info.icon)"
              color="primary"
              size="sm"
              :label="scene.info.name"
              :aria-label="`Open ${scene.info.name}`"
            />
          </div>
        </template>
      </UCollapsible>
    </template>
  </UPageCard>
</template>
