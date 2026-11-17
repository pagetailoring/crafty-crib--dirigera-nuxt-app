import type { Scene } from 'dirigera'

export function useSceneDetails() {
  return {
    listScenes: () => $fetch<Scene[]>('/api/dirigera/scenes'),
    listProducts: () => $fetch<SceneProduct[]>('/api/dirigera/scene-products'),
    updateScene: (id: string, input: SceneUpdateInput) =>
      $fetch<Scene>(`/api/dirigera/scenes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
  }
}
