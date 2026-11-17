import type { Device, Scene } from 'dirigera'
import { describe, expect, it } from 'vitest'
import { deviceAssociations } from '~/utils/device-associations'

const device = (
  id: string,
  type: Device['type'],
  remoteLinks: string[] = [],
  deviceSet: Device['deviceSet'] = []
) => ({ id, type, remoteLinks, deviceSet }) as Device

describe('device associations', () => {
  it('resolves remote links in either direction and scenes through triggers and groups', () => {
    const remote = device('remote', 'controller')
    const light = device(
      'light',
      'light',
      ['remote'],
      [{ id: 'group' } as Device['deviceSet'][number]]
    )
    const plug = device('plug', 'outlet')
    const scenes = [
      {
        id: 'evening',
        info: { name: 'Evening' },
        triggers: [{ type: 'controller', trigger: { deviceId: 'remote' } }],
        actions: [{ type: 'deviceSet', deviceId: 'group' }],
        commands: [],
      },
      {
        id: 'plug-scene',
        info: { name: 'Plug scene' },
        triggers: [],
        actions: [{ type: 'device', deviceId: 'plug' }],
        commands: [],
      },
    ] as unknown as Scene[]

    expect(
      deviceAssociations(remote, [remote, light, plug], scenes)
    ).toMatchObject({
      devices: [light],
      scenes: [scenes[0]],
    })
    expect(
      deviceAssociations(light, [remote, light, plug], scenes)
    ).toMatchObject({
      remotes: [remote],
      scenes: [scenes[0]],
    })
    expect(
      deviceAssociations(plug, [remote, light, plug], scenes)
    ).toMatchObject({
      remotes: [],
      scenes: [scenes[1]],
    })
  })
})
