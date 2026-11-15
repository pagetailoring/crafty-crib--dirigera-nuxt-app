import type { Device, DirigeraClient } from 'dirigera'
import { graphql, GraphQLError } from 'graphql'
import { dirigeraSchema } from './dirigera-schema'
import { getRoomView } from './dirigera-home'

export interface GraphqlBody {
  query: string
  variables?: Record<string, unknown>
  operationName?: string
}

type ControlArguments = {
  id: string
  type: 'DEVICE' | 'DEVICE_SET'
} & Partial<Device['attributes']>

export async function executeDirigeraQuery(
  client: DirigeraClient,
  body: GraphqlBody
) {
  // Each operation observes one home snapshot, including quick-control commands.
  let home: ReturnType<DirigeraClient['home']> | undefined
  const getHome = () => (home ??= client.home())
  const setAttributes = async ({
    id,
    type,
    ...attributes
  }: ControlArguments) => {
    const target = type === 'DEVICE' ? client.devices : client.deviceSets
    await target.setAttributes({ id, attributes })
    return true
  }
  const root = {
    async rooms() {
      const state = await getHome()
      return state.rooms
        .map(room => getRoomView(room, state))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    async room({ id }: { id: string }) {
      const state = await getHome()
      const room = state.rooms.find(room => room.id === id)
      return room ? getRoomView(room, state) : null
    },
    async scenes() {
      return (await getHome()).scenes
        .filter(scene => scene.type === 'userScene')
        .map(scene => ({ id: scene.id, name: scene.info.name }))
    },
    async activateScene({ id }: { id: string }) {
      await client.scenes.trigger({ id })
      return null
    },
    async devicePlayItemImageURL({ id }: { id: string }) {
      const device = (await getHome()).devices.find(device => device.id === id)
      const url = device?.attributes.playbackAudio?.playItem?.imageURL
      if (!url) return null
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error('Artwork request failed.')
      const buffer = Buffer.from(await response.arrayBuffer())
      return `data:${response.headers.get('content-type') ?? 'image/jpeg'};base64,${buffer.toString('base64')}`
    },
    async quickControl({
      roomId,
      type,
      isOn,
    }: {
      roomId: string
      type: 'LIGHTS' | 'OUTLETS' | 'SPEAKERS'
      isOn?: boolean | null
    }) {
      const deviceType = {
        LIGHTS: 'light',
        OUTLETS: 'outlet',
        SPEAKERS: 'speaker',
      }[type]
      const devices = (await getHome()).devices.filter(
        device => device.room?.id === roomId && device.type === deviceType
      )
      await Promise.all(
        devices.map(device => {
          if (device.type === 'speaker') {
            return client.speakers.setPlayback({
              id: device.id,
              playback: isOn ? 'playbackPlaying' : 'playbackPaused',
            })
          }
          const target =
            device.type === 'light' ? client.lights : client.outlets
          return target.setIsOn({ id: device.id, isOn: Boolean(isOn) })
        })
      )
      return null
    },
    setIsOn: setAttributes,
    setLightLevel: setAttributes,
    setColorTemperature: setAttributes,
    setColorHueAndSaturation: setAttributes,
    setPlayback: setAttributes,
    setVolume: setAttributes,
  }

  // Hub errors can contain transport details. Keep them out of public responses.
  const rootValue = Object.fromEntries(
    Object.entries(root).map(([name, resolve]) => [
      name,
      async (args: never) => {
        try {
          return await resolve(args)
        } catch {
          throw new GraphQLError(
            'The Dirigera operation failed. Check the hub connection.'
          )
        }
      },
    ])
  )
  return graphql({
    schema: dirigeraSchema,
    source: body.query,
    variableValues: body.variables,
    operationName: body.operationName,
    rootValue,
  })
}
