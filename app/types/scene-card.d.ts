import type { Scene } from 'dirigera'

/** One trigger from a Dirigera scene. */
export type Trigger = NonNullable<Scene['triggers']>[number]
