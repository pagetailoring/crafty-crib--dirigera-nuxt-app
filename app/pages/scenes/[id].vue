<script setup lang="ts">
import type { Scene } from 'dirigera'
import type { SceneProduct } from '../../../shared/types/scene-editor'

const route = useRoute()
const sceneDetails = useSceneDetails()
const scene = ref<Scene | null>(null)
const products = ref<SceneProduct[]>([])
const sceneError = ref<Error | null>(null)
const productError = ref<Error | null>(null)

const [sceneResult, productResult] = await Promise.allSettled([
  sceneDetails.listScenes(),
  sceneDetails.listProducts(),
])
if (sceneResult.status === 'fulfilled') {
  scene.value =
    sceneResult.value.find(item => item.id === route.params.id) ?? null
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
  scene.value = updated
}
</script>

<template>
  <UContainer>
    <UButton
      to="/scenes"
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-left"
      label="All scenes"
    />

    <UAlert
      v-if="sceneError"
      color="error"
      title="Unable to load scene"
      :description="sceneError.message"
    />
    <UAlert v-else-if="!scene" color="neutral" title="Scene not found" />
    <template v-else>
      <UAlert
        v-if="productError"
        color="warning"
        title="Product names are unavailable"
        description="The scene still appears, but some products may show their IDs."
      />
      <ScenesSceneCard
        :scene="scene"
        :products="products"
        @updated="replaceScene"
      />
    </template>
  </UContainer>
</template>
