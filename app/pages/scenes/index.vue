<script setup lang="ts">
import type { Scene } from 'dirigera'
import type { SceneProduct } from '#shared/types/scene-editor'

const sceneDetails = useSceneDetails()
const scenes = ref<Scene[]>([])
const products = ref<SceneProduct[]>([])
const sceneError = ref<Error | null>(null)
const productError = ref<Error | null>(null)

const [sceneResult, productResult] = await Promise.allSettled([
  sceneDetails.listScenes(),
  sceneDetails.listProducts(),
])
if (sceneResult.status === 'fulfilled') {
  scenes.value = sceneResult.value
} else {
  sceneError.value =
    sceneResult.reason instanceof Error
      ? sceneResult.reason
      : new Error(String(sceneResult.reason))
}
if (productResult.status === 'fulfilled') {
  products.value = productResult.value
} else {
  productError.value =
    productResult.reason instanceof Error
      ? productResult.reason
      : new Error(String(productResult.reason))
}

function replaceScene(updated: Scene) {
  scenes.value = scenes.value.map(scene =>
    scene.id === updated.id ? updated : scene
  )
}
</script>

<template>
  <UContainer>
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Scenes</h1>
        <p class="mt-1 text-sm text-muted">
          Review what each scene does and edit its products or schedule.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton to="/scenes/debug"> Debug view </UButton>
        <UButton to="/" color="neutral" variant="ghost">Home</UButton>
      </div>
    </div>

    <UAlert
      v-if="sceneError"
      class="mb-6"
      color="error"
      title="Unable to load scenes"
      :description="sceneError.message"
    />
    <UAlert
      v-if="productError"
      class="mb-6"
      color="warning"
      title="Product names are unavailable"
      description="Scenes still appear, but some products may show their IDs."
    />

    <UPageGrid
      class="static gap-5 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2"
    >
      <ScenesSceneCard
        v-for="scene in scenes"
        :key="scene.id"
        :scene="scene"
        :products="products"
        show-details-link
        @updated="replaceScene"
      />
    </UPageGrid>

    <UAlert
      v-if="!sceneError && scenes.length === 0"
      color="neutral"
      title="No scenes"
    />
  </UContainer>
</template>
