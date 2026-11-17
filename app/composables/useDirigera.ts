import { createDirigeraClient } from '~/utils/dirigera-client'
import { createGraphqlRequest } from '~/utils/graphql-request'

/** Provide a Dirigera client configured to use the app's GraphQL endpoint. */
export function useDirigera() {
  return createDirigeraClient(createGraphqlRequest($fetch))
}
