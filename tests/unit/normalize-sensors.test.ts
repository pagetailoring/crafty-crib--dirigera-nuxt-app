import type { Device, Scene } from 'dirigera'
import { describe, expect, it } from 'vitest'
import { normalizeSensors } from '../../app/services/normalize-sensors'
import { deviceAssociations } from '../../app/services/device-associations'

const endpoint = (id: string, overrides: Partial<Device> = {}) =>
  ({
    id,
    relationId: 'physical-sensor',
    type: 'sensor',
    deviceType: 'environmentSensor',
    attributes: { customName: 'Sensor', model: 'TIMMERFLOTTE' },
    capabilities: { canSend: [], canReceive: [] },
    deviceSet: [],
    remoteLinks: [],
    ...overrides,
  }) as Device

describe('sensor normalization', () => {
  it('combines readings before room filtering without mutating the source', () => {
    const temperature = endpoint('sensor_1', {
      room: { id: 'kitchen', name: 'Kitchen' } as Device['room'],
      attributes: {
        currentTemperature: 21.549999237,
        batteryPercentage: 88,
      } as Device['attributes'],
    })
    const humidity = endpoint('sensor_2', {
      attributes: { currentRH: 41 } as Device['attributes'],
    })
    const result = normalizeSensors([humidity, temperature])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'sensor_1',
      room: { id: 'kitchen' },
      attributes: {
        currentTemperature: 21.55,
        currentRH: 41,
        batteryPercentage: 88,
      },
      sourceIds: ['sensor_2', 'sensor_1'],
    })
    expect(temperature.attributes.currentRH).toBeUndefined()
    expect(temperature.attributes.currentTemperature).toBe(21.549999237)
    expect(humidity.room).toBeUndefined()
  })

  it.each([
    [21.56999969482422, 21.57],
    [-12.346, -12.35],
    [0, 0],
    [21.5, 21.5],
  ])(
    'rounds standalone sensor temperature %s to %s as a number',
    (input, expected) => {
      const sensor = endpoint('single', {
        relationId: '',
        attributes: { currentTemperature: input } as Device['attributes'],
      })
      expect(normalizeSensors([sensor])[0]!.attributes.currentTemperature).toBe(
        expected
      )
      expect(sensor.attributes.currentTemperature).toBe(input)
    }
  )

  it('includes the unknown light sensor endpoint of a motion sensor', () => {
    const light = endpoint('motion_1', {
      type: 'unknown',
      deviceType: 'lightSensor',
      attributes: { illuminance: 120 } as Device['attributes'],
    })
    const motion = endpoint('motion_2', {
      deviceType: 'occupancySensor',
      attributes: { isDetected: false } as Device['attributes'],
    })
    expect(normalizeSensors([light, motion])).toMatchObject([
      {
        id: 'motion_2',
        type: 'sensor',
        attributes: { illuminance: 120, isDetected: false },
      },
    ])
  })

  it('leaves controllers and sensors without a shared relation unchanged', () => {
    const devices = [
      endpoint('switch_1', { type: 'controller' }),
      endpoint('switch_2', { type: 'controller' }),
      endpoint('sensor_1', { relationId: '' }),
      endpoint('sensor_2', { relationId: '' }),
      endpoint('sensor_3', { relationId: 'other' }),
    ]
    expect(normalizeSensors(devices)).toEqual(devices)
  })

  it('does not merge sensors assigned to conflicting rooms', () => {
    const devices = ['kitchen', 'bedroom'].map(id =>
      endpoint(id, {
        room: { id } as Device['room'],
      })
    )
    expect(normalizeSensors(devices)).toEqual(devices)
  })

  it('retains scenes and remote links targeting either source endpoint', () => {
    const sensor = normalizeSensors([
      endpoint('sensor_1'),
      endpoint('sensor_2'),
    ])[0]!
    const remote = endpoint('remote', {
      type: 'controller',
      remoteLinks: ['sensor_2'],
    })
    const scenes = [
      {
        id: 'event',
        actions: [],
        triggers: [{ type: 'event', trigger: { deviceId: 'sensor_2' } }],
      },
      {
        id: 'action',
        actions: [{ type: 'device', deviceId: 'sensor_1' }],
        triggers: [],
      },
    ] as unknown as Scene[]
    expect(deviceAssociations(sensor, [sensor, remote], scenes)).toMatchObject({
      remotes: [remote],
      scenes,
    })
    expect(
      deviceAssociations(remote, [sensor, remote], scenes).devices
    ).toEqual([sensor])
  })
})
