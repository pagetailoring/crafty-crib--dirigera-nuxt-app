import type { Device } from 'dirigera'

export type NormalizedDevice = Device & { sourceIds?: string[] }
