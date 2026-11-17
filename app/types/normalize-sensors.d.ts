import type { Device } from 'dirigera'

/** Device data that may retain the identifiers of merged sensor endpoints. */
export type NormalizedDevice = Device & { sourceIds?: string[] }
