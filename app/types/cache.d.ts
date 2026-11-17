/** Cached data together with its refresh time and staleness state. */
export interface CacheEntry<T> {
  data: T
  refreshedAt: number
  stale: boolean
}

/** Options that control how cached data is loaded. */
export interface LoadOptions {
  force?: boolean
}
