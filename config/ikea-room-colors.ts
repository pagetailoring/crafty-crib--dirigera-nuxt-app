import type { Room } from 'dirigera'

// Approximate display swatches. The hub supplies palette names, not RGB values.
export const IKEA_ROOM_COLORS = {
  ikea_green_no_65: '#8fae8b',
  ikea_yellow_no_24: '#e4c96b',
  ncs_s_1020_r10b: '#e8b9bc',
  ikea_red_no_39: '#bd6460',
  ikea_blue_no_58: '#7c9eb7',
  ikea_lilac_no_3: '#b6a0c5',
  ikea_orange_no_11: '#d99462',
  ikea_yellow_no_31: '#d7b352',
  pantone_16_0230_tcx: '#8c9f6b',
  ikea_brown_no_41: '#9b7967',
  ikea_yellow_no_28: '#ecd490',
  ikea_blue_no_63: '#92b6c9',
  ikea_pink_no_4: '#d4a0b2',
  ikea_beige_1: '#d5c4aa',
  pantone_16_0940_tcx: '#c9a44c',
  pantone_15_0522_tcx: '#b3b87a',
  ikea_green_no_66: '#6f927d',
  ikea_blue_no_60: '#688ba8',
  ikea_pink_no_6: '#e0b8c4',
  ncs_s_4010_g10y: '#87917e',
  ikea_turquoise_5: '#7eb7b4',
  ikea_beige_no_3: '#c7b59b',
  ikea_pink_no_8: '#c58a9e',
  ikea_yellow_no_27: '#e0be65',
  ikea_beige_no_4: '#b8a58f',
  ikea_blue_no_52: '#9fb7c7',
  ikea_white_no_20: '#eee9df',
  ikea_yellow_no_30: '#d5b45c',
  ikea_green_no_63: '#a6b695',
} satisfies Record<Room['color'], string>

export function getIkeaRoomColor(color?: string | null): string | undefined {
  return color && Object.hasOwn(IKEA_ROOM_COLORS, color)
    ? IKEA_ROOM_COLORS[color as keyof typeof IKEA_ROOM_COLORS]
    : undefined
}
