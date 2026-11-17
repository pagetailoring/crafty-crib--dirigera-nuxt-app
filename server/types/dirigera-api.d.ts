import type { Device } from 'dirigera'

/** Request body accepted by the Dirigera GraphQL endpoint. */
export interface GraphqlBody {
  query: string
  variables?: Record<string, unknown>
  operationName?: string
}

/** GraphQL device-control arguments forwarded to the Dirigera client. */
export type ControlArguments = {
  id: string
  type: ControlType
} & Partial<Device['attributes']>
