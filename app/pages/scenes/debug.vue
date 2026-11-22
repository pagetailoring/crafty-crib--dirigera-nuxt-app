<script setup lang="ts">
import type { Scene } from 'dirigera'

const sceneDetails = useSceneDetails()
const dirigera = useDirigera()
const scenes = ref<Scene[]>([])
const activeSceneId = ref<string | null>(null)
const error = ref<Error | null>(null)

try {
  scenes.value = await sceneDetails.listScenes()
} catch (cause) {
  error.value = cause instanceof Error ? cause : new Error(String(cause))
}

const formatTimestamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : 'Never'

const formatDetails = (value: unknown) => JSON.stringify(value, null, 2)

async function testScene(scene: Scene) {
  activeSceneId.value = scene.id
  error.value = null
  try {
    await dirigera.activateScene(scene.id)
  } catch (cause) {
    error.value = cause instanceof Error ? cause : new Error(String(cause))
  } finally {
    activeSceneId.value = null
  }
}
</script>

<template>
  <UContainer>
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Scenes</h1>
      <UButton to="/" color="neutral" variant="ghost">Back to home</UButton>
    </div>

    <UAlert
      v-if="error"
      class="mb-4"
      color="error"
      title="Unable to complete the scene request"
      :description="error.message"
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard v-for="scene in scenes" :key="scene.id">
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="font-semibold">{{ scene.info.name }}</h2>
              <p class="mt-1 text-sm text-muted">{{ scene.id }}</p>
            </div>
            <UBadge color="neutral" variant="outline">
              {{ scene.type }}
            </UBadge>
          </div>
        </template>

        <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted">Icon</dt>
          <dd class="break-all">{{ scene.info.icon }}</dd>
          <dt class="text-muted">Created</dt>
          <dd>{{ formatTimestamp(scene.createdAt) }}</dd>
          <dt class="text-muted">Last triggered</dt>
          <dd>{{ formatTimestamp(scene.lastTriggered) }}</dd>
          <dt class="text-muted">Last completed</dt>
          <dd>{{ formatTimestamp(scene.lastCompleted) }}</dd>
          <dt class="text-muted">Undo allowed</dt>
          <dd>{{ scene.undoAllowedDuration }} ms</dd>
          <dt class="text-muted">Last undo</dt>
          <dd>{{ formatTimestamp(scene.lastUndo) }}</dd>
        </dl>

        <div class="mt-6 space-y-5">
          <section>
            <h3 class="mb-2 font-medium">
              Triggers ({{ scene.triggers?.length ?? 0 }})
            </h3>
            <p v-if="!scene.triggers?.length" class="text-sm text-muted">
              No triggers
            </p>
            <pre
              v-for="(trigger, index) in scene.triggers"
              :key="trigger.id ?? index"
              class="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs"
              >{{ formatDetails(trigger) }}</pre>
          </section>

          <section>
            <h3 class="mb-2 font-medium">
              Actions ({{ scene.actions.length }})
            </h3>
            <p v-if="scene.actions.length === 0" class="text-sm text-muted">
              No actions
            </p>
            <pre
              v-for="(action, index) in scene.actions"
              :key="action.id ?? index"
              class="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs"
              >{{ formatDetails(action) }}</pre>
          </section>

          <section>
            <h3 class="mb-2 font-medium">
              Commands ({{ scene.commands.length }})
            </h3>
            <p v-if="scene.commands.length === 0" class="text-sm text-muted">
              No commands
            </p>
            <pre
              v-for="command in scene.commands"
              :key="command.id"
              class="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs"
              >{{ formatDetails(command) }}</pre>
          </section>
        </div>

        <template #footer>
          <UButton
            :loading="activeSceneId === scene.id"
            :aria-label="`Test ${scene.info.name}`"
            @click="testScene(scene)"
          >
            Test scene
          </UButton>
        </template>
      </UCard>
    </div>

    <UAlert
      v-if="!error && scenes.length === 0"
      color="neutral"
      title="No scenes"
    />
  </UContainer>
</template>
