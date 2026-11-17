import type { Scene } from 'dirigera'

/** Provide API operations for listing and updating detailed Dirigera scenes. */
export function useSceneDetails() {
  return {
    /** Fetch all editable scenes. */
    listScenes: () => $fetch<Scene[]>('/api/dirigera/scenes'),
    /** Fetch devices and device sets available to scene actions. */
    listProducts: () => $fetch<SceneProduct[]>('/api/dirigera/scene-products'),
    /** Submit validated changes to an existing scene. */
    updateScene: (id: string, input: SceneUpdateInput) =>
      $fetch<Scene>(`/api/dirigera/scenes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
  }
}
