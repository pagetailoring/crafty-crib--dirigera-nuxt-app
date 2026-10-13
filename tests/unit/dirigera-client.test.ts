import { describe, expect, it, vi } from 'vitest'

import { createDirigeraClient } from '../../app/services/dirigera-client'

describe('Dirigera client', () => {
  it('lists rooms with their environment readings and quick controls', async () => {
    const request = vi.fn().mockResolvedValue({
      rooms: [
        {
          id: 'living-room',
          name: 'Living Room',
          temperature: 22.46,
          humidity: 44.8,
          pm25: 3,
          vocIndex: 98,
          co2: 612,
          quickControls: [
            { id: 'living-room-lights', type: 'LIGHTS', isOn: true },
          ],
        },
      ],
    })

    const client = createDirigeraClient(request)

    await expect(client.listRooms()).resolves.toEqual([
      {
        id: 'living-room',
        name: 'Living Room',
        temperature: 22.46,
        humidity: 44.8,
        pm25: 3,
        vocIndex: 98,
        co2: 612,
        quickControls: [
          { id: 'living-room-lights', type: 'LIGHTS', isOn: true },
        ],
      },
    ])
    expect(request).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith(expect.stringContaining('query Rooms'))
  })
})
