import type { Device } from 'dirigera'

export interface GraphqlBody {
  query: string
  variables?: Record<string, unknown>
  operationName?: string
}

export type ControlArguments = {
  id: string
  type: 'DEVICE' | 'DEVICE_SET'
} & Partial<Device['attributes']>
