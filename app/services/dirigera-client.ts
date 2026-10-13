export type QuickControlType = 'LIGHTS' | 'OUTLETS' | 'SPEAKERS'

export interface QuickControl {
  id: string
  type: QuickControlType
  isOn: boolean | null
}

export interface RoomSummary {
  id: string
  name: string
  temperature: number | null
  humidity: number | null
  pm25: number | null
  vocIndex: number | null
  co2: number | null
  quickControls: QuickControl[]
}

type GraphqlRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<T>

const roomsQuery = `
  query Rooms {
    rooms {
      id
      name
      temperature
      humidity
      pm25
      vocIndex
      co2
      quickControls {
        id
        type
        isOn
      }
    }
  }
`

export function createDirigeraClient(request: GraphqlRequest) {
  return {
    async listRooms() {
      const data = await request<{ rooms: RoomSummary[] }>(roomsQuery)
      return data.rooms
    },
  }
}
