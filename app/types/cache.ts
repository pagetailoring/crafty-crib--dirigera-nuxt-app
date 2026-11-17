export interface CacheEntry<T> {
  data: T
  refreshedAt: number
  stale: boolean
}

export interface LoadOptions {
  force?: boolean
}
