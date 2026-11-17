declare global {
  /**
   * Target kind used when controlling a device or a device set.
   * Mirrors the `ControlType` enum in the GraphQL schema.
   */
  type ControlType = 'DEVICE' | 'DEVICE_SET'
}

export {}
