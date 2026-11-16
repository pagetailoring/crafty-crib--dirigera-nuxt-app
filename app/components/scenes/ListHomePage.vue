<script setup lang="ts">
const cache = useDirigeraCacheStore()
const { scenes, pending } = storeToRefs(cache)
const activeSceneId = ref<string | null>(null)

async function activateScene(id: string) {
  activeSceneId.value = id
  try {
    await cache.activateScene(id)
  } finally {
    activeSceneId.value = null
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <slot />
    <UButton
      v-for="scene in scenes?.data"
      :key="scene.id"
      :loading="activeSceneId === scene.id"
      @click="activateScene(scene.id)"
    >
      {{ scene.name }}
    </UButton>
    <USkeleton v-if="pending.scenes" class="h-8 w-24" />
    <!-- <small>{{ scenes?.data }}</small> -->
  </div>
</template>
