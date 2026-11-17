// GraphQL contract adapted from lpgera/dirigera-web. See THIRD_PARTY_NOTICES.md.
import { buildSchema } from 'graphql'

export const dirigeraSchema = buildSchema(`
  type Query { _: String }
  type Mutation { _: String }

  type Room {
    id: String!
    name: String!
    icon: String
    color: String
  }

  extend type Query {
    temperatureLights: [Device!]!
    rooms: [Room!]!
    room(id: String!): Room
  }

  extend type Room {
    devices: [Device!]!
    temperature: Float
    humidity: Float
    pm25: Float
    vocIndex: Float
    co2: Float
  }

  type Device {
    id: String!
    name: String!
    type: ControlType!
    deviceType: String
    productName: String
    roomName: String
    isReachable: Boolean!
    lastSeen: String!
    batteryPercentage: Int
    isOn: Boolean
    lightLevel: Int
    colorTemperature: Int
    colorTemperatureMin: Int
    colorTemperatureMax: Int
    colorSaturation: Float
    colorHue: Float
    playback: Playback
    playbackPauseAvailable: Boolean
    playbackNextAvailable: Boolean
    playbackPreviousAvailable: Boolean
    volume: Int
    playItem: String
    nextPlayItem: String
    temperature: Float
    humidity: Float
    pm25: Int
    vocIndex: Int
    co2: Int
    isOpen: Boolean
    isDetected: Boolean
    illuminance: Int
  }

  extend type Query {
    devicePlayItemImageURL(id: String!): String
  }

  extend type Mutation {
    setIsOn(id: String!, type: ControlType!, isOn: Boolean!): Boolean
    setLightLevel(id: String!, type: ControlType!, lightLevel: Int!): Boolean

    setColorTemperature(
      id: String!
      type: ControlType!
      colorTemperature: Int!
    ): Boolean
    setColorHueAndSaturation(
      id: String!
      type: ControlType!
      colorHue: Float!
      colorSaturation: Float!
    ): Boolean
    setPlayback(id: String!, type: ControlType!, playback: Playback!): Boolean

    setVolume(id: String!, type: ControlType!, volume: Int!): Boolean
  }

  extend type Room {
    quickControls: [QuickControl!]!
  }

  enum QuickControlType {
    LIGHTS
    OUTLETS
    SPEAKERS
  }

  type QuickControl {
    id: String!
    type: QuickControlType!
    isOn: Boolean
  }

  extend type Mutation {
    quickControl(
      roomId: String!
      type: QuickControlType!
      isOn: Boolean
    ): Boolean
  }

  type Scene {
    id: String!
    name: String!
    icon: String
  }

  extend type Query {
    scenes: [Scene!]!
  }

  extend type Mutation {
    activateScene(id: String!): String
  }

  enum Playback {
    playbackPlaying
    playbackPaused
    playbackNext
    playbackPrevious
    playbackIdle
    playbackBuffering
  }

  enum ControlType {
    DEVICE
    DEVICE_SET
  }
`)
