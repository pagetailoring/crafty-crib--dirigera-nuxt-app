import { createDirigeraClient } from '../services/dirigera-client'
import { createGraphqlRequest } from '../services/graphql-request'

export function useDirigera() {
  return createDirigeraClient(createGraphqlRequest($fetch))
}
