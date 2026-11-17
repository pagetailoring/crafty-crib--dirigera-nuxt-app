import { createDirigeraClient } from '~/utils/dirigera-client'
import { createGraphqlRequest } from '~/utils/graphql-request'

export function useDirigera() {
  return createDirigeraClient(createGraphqlRequest($fetch))
}
