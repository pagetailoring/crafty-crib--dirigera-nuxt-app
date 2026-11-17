declare global {
  /**
   * White spectrum limits reported by a bulb or another light-emitting device.
   */
  interface ColorTemperatureAttributes {
    colorTemperatureMin?: number | null
    colorTemperatureMax?: number | null
  }
}

export {}
