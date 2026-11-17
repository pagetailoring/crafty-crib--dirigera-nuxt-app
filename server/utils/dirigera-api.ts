import type {
  ControlArguments,
  GraphqlBody,
} from '@@/server/types/dirigera-api'
import { getDeviceViews, getRoomView } from '@@/server/utils/dirigera-home'
import { dirigeraSchema } from '@@/server/utils/dirigera-schema'
import type { DirigeraClient } from 'dirigera'
import { graphql, GraphQLError } from 'graphql'

/** Execute one GraphQL request against a consistent snapshot of the Dirigera home. */
export async function executeDirigeraQuery(
  client: DirigeraClient,
  body: GraphqlBody
) {
  // Each operation observes one home snapshot, including quick-control commands.
  let home: ReturnType<DirigeraClient['home']> | undefined
  /** Load and reuse the home snapshot for the current GraphQL operation. */
  const getHome = () => (home ??= client.home())
  /** Apply GraphQL control attributes to a device or device set. */
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
    /** List lights that support color-temperature control. */
    async temperatureLights() {
      return getDeviceViews(
        (await getHome()).devices.filter(
          device =>
            device.type === 'light' &&
            device.capabilities.canReceive.includes('colorTemperature')
        )
      ).sort((a, b) => a.name.localeCompare(b.name))
    },
    /** List room summaries derived from the current home snapshot. */
    async rooms() {
      const state = await getHome()
      return state.rooms
        .map(room => getRoomView(room, state))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    /** Resolve one room view by its Dirigera identifier. */
    async room({ id }: { id: string }) {
      const state = await getHome()
      const room = state.rooms.find(room => room.id === id)
      return room ? getRoomView(room, state) : null
    },
    /** List user-created scenes available for activation. */
    async scenes() {
      return (await getHome()).scenes
        .filter(scene => scene.type === 'userScene')
        .map(scene => ({
          id: scene.id,
          name: scene.info.name,
          icon: scene.info.icon ?? null,
        }))
    },
    /** Trigger a Dirigera scene by its identifier. */
    async activateScene({ id }: { id: string }) {
      await client.scenes.trigger({ id })
      return null
    },
    /** Fetch and encode the current media artwork for a device. */
    async devicePlayItemImageURL({ id }: { id: string }) {
      const device = (await getHome()).devices.find(device => device.id === id)
      const url = device?.attributes.playbackAudio?.playItem?.imageURL
      if (!url) return null
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error('Artwork request failed.')
      const buffer = Buffer.from(await response.arrayBuffer())
      return `data:${response.headers.get('content-type') ?? 'image/jpeg'};base64,${buffer.toString('base64')}`
    },
    /** Apply a room-wide power or playback state to one device category. */
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
