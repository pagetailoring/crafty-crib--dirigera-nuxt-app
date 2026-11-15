---
createdAt: 2026-10-13
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
---

# Dirigera backend migration coverage

## Question

Compare the integrated Nuxt backend under `server/` with the reference backend
from `lpgera/dirigera-web`. Determine whether all behavior was transferred and
map each reference structure to its Nuxt counterpart.

## Sources and scope

The original comparison used source files in both local repositories. The
reference backend was `lpgera/dirigera-web` at commit
`7f14eace5cd865c6a28f5167665d5fd873898f21`; the reviewed Nuxt target is commit
`4a2c32a0e5823ca4dda5a9bc1a6fbc12c3309a33`. The backend was introduced at
`122e7d6a3e5a32c68701a859040ce04793db248b`; a whitespace-insensitive review of
`server/` since that commit found no backend behavior change. The comparison covers runtime
behavior, GraphQL operations, hub communication, updates, authentication,
shutdown, supporting generation, and tests. It does not compare either
frontend.

Primary sources:

- [Reference server entrypoint](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/index.ts)
- [Reference GraphQL definitions](https://github.com/lpgera/dirigera-web/tree/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions)
- [Reference authentication and request context](https://github.com/lpgera/dirigera-web/tree/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql)
- [Integrated Nuxt server](../../../server/)
- [Integrated backend tests](../../../tests/unit/dirigera-backend.test.ts)

## 2026-11-15 checkout review

The active target is now commit `4005c9f`. The authentication and code
generation conclusions below remain current. The trusted-LAN model still has
no GraphQL login boundary, and resolver arguments and results are still
handwritten.

The backend task is no longer a zero-progress task. The current server exposes
`/api/dirigera/status`, probes `home()` before setting the shared connection to
`ready`, and permits retry after connection or probe failure. This implements
the readiness and retry portion of the task.

Error reporting remains incomplete. `executeDirigeraQuery` still replaces every
root failure with one safe GraphQL message and discards the original cause. It
does not log structured operation context or return stable safe categories.
The current branch also adds temperature-light queries and scene editing
endpoints that were outside the original reference-backend comparison.

The mapping and conclusion below describe the `4a2c32a` snapshot. Use this
section for the current task status and use the original tables for migration
history.

## Conclusion

At the reviewed snapshot, all domain behavior used by the Nuxt frontend was
transferred: rooms,
room sensor averages, device and device-set presentation, related-device
attribute merging, quick controls, user scenes, artwork, all six device control
mutations, the shared hub client, and update broadcasts. The frontend can use
the same GraphQL operations against the integrated endpoint.

The complete reference backend was not transferred. The missing functional
area is its password login and JWT authorization system. The Nuxt GraphQL
endpoint has no user authentication and does not require the reference
`x-token` header. Its short-lived HMAC token authorizes only a WebSocket
upgrade and can be obtained from an unauthenticated same-server endpoint. This
is a deliberate trusted-LAN access model, but it is not security-equivalent to
the reference backend.

GraphQL code generation, Apollo-specific HTTP behavior, explicit static-file
cache headers, and explicit response compression also have no direct
counterpart. Nuxt and Nitro replace the server ownership concerns, while
codegen and access control remain genuinely absent.

## Structure mapping

| Reference backend                                                                                                                                                                                                                                                                                                                  | Integrated Nuxt backend                                                                                                                                                                                                                        | Status                                      | Function                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/index.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/index.ts)                                                                                                                                                                                                        | [`nuxt.config.ts`](../../../nuxt.config.ts), [`server/api/`](../../../server/api/), [`server/routes/`](../../../server/routes/), [`server/plugins/`](../../../server/plugins/)                                                                             | Replaced by Nuxt                            | The reference file owns Express, HTTP, Apollo, static files, WebSocket upgrades, startup, and signals. Nuxt splits these responsibilities across Nitro configuration, file-based handlers, and lifecycle hooks.                                    |
| [`src/dirigera.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/dirigera.ts)                                                                                                                                                                                                  | [`server/utils/dirigera.ts`](../../../server/utils/dirigera.ts), [`server/services/dirigera-connection.ts`](../../../server/services/dirigera-connection.ts)                                                                                         | Transferred with changed lifecycle          | Creates the `dirigera` client from gateway IP and access token. Nuxt adds shared lazy initialization and retries after initialization failure.                                                                                                     |
| `src/index.ts` update listener and `WebSocketServer`                                                                                                                                                                                                                                                                               | [`server/services/dirigera-connection.ts`](../../../server/services/dirigera-connection.ts), [`server/routes/dirigera-updates.ts`](../../../server/routes/dirigera-updates.ts)                                                                       | Transferred                                 | Starts one hub listener, ignores `pong`, and broadcasts `update` to connected browsers. Nitro owns the WebSocket server and route.                                                                                                                 |
| `src/index.ts` signal handler                                                                                                                                                                                                                                                                                                      | [`server/plugins/dirigera.ts`](../../../server/plugins/dirigera.ts), [`server/services/dirigera-connection.ts`](../../../server/services/dirigera-connection.ts)                                                                                     | Replaced by Nitro                           | Stops the hub update listener during Nitro shutdown. Nitro owns HTTP and peer shutdown instead of application-level signal handlers.                                                                                                               |
| [`src/graphql/server.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/server.ts)                                                                                                                                                                                      | [`server/services/dirigera-schema.ts`](../../../server/services/dirigera-schema.ts), [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)                                                                                   | Partially transferred                       | Preserves the domain schema and operations, using `graphql()` and a root resolver object instead of Apollo, executable-schema composition, and field resolvers.                                                                                    |
| [`src/graphql/context.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/context.ts)                                                                                                                                                                                    | [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)                                                                                                                                                                     | Domain snapshot transferred; auth removed   | Keeps one lazy `client.home()` snapshot per GraphQL operation. It no longer verifies `x-token` or supplies `isLoggedIn`.                                                                                                                           |
| [`definitions/room.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/room.ts)                                                                                                                                                                              | [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts), [`server/services/dirigera-home.ts`](../../../server/services/dirigera-home.ts)                                                                                       | Transferred                                 | Lists rooms alphabetically, finds one room, and returns `null` for an unknown room. The Nuxt mapper eagerly builds the room fields.                                                                                                                |
| [`definitions/device.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/device.ts)                                                                                                                                                                          | [`server/services/dirigera-home.ts`](../../../server/services/dirigera-home.ts), [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)                                                                                       | Transferred                                 | Preserves capability-aware attributes, relation merging, device-set grouping, ordering, environmental averages, artwork conversion, and device/device-set command routing.                                                                         |
| `definitions/device.ts#getImageAsBase64`                                                                                                                                                                                                                                                                                           | `server/services/dirigera-api.ts#devicePlayItemImageURL`                                                                                                                                                                                       | Transferred with safeguards                 | Still returns a data URL. Nuxt adds a 10-second timeout, rejects non-success HTTP responses, and supplies a fallback media type.                                                                                                                   |
| [`definitions/quickControl.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/quickControl.ts)                                                                                                                                                              | [`server/services/dirigera-home.ts`](../../../server/services/dirigera-home.ts), [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)                                                                                       | Transferred                                 | Builds controls only for reachable lights, outlets, and speakers, derives their aggregate on state, and fans commands out to matching room devices.                                                                                                |
| [`definitions/scene.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/scene.ts)                                                                                                                                                                            | [`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)                                                                                                                                                                     | Transferred                                 | Lists only `userScene` entries and triggers a scene by ID.                                                                                                                                                                                         |
| [`definitions/controlType.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/controlType.ts), [`definitions/playback.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/playback.ts) | [`server/services/dirigera-schema.ts`](../../../server/services/dirigera-schema.ts)                                                                                                                                                               | Transferred                                 | Preserves GraphQL enum values for device targets and playback commands.                                                                                                                                                                            |
| [`definitions/auth.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/definitions/auth.ts), [`src/jwt.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/jwt.ts)                                                     | No GraphQL equivalent; [`server/utils/dirigera-session.ts`](../../../server/utils/dirigera-session.ts) covers WebSocket upgrades only                                                                                                             | Missing                                     | The reference password login issues configurable-expiry JWTs used by GraphQL and WebSocket requests. Nuxt issues fixed 60-second, process-local update tokens without authenticating a user.                                                       |
| [`directives/loggedIn.ts`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/src/graphql/directives/loggedIn.ts)                                                                                                                                                                        | No equivalent                                                                                                                                                                                                                                  | Missing                                     | The reference protects every domain query and mutation and returns `UNAUTHENTICATED` with HTTP 401 metadata. The Nuxt endpoint checks request shape and rejects a mismatched `Origin`, but requests without an `Origin` header need no credential. |
| Reference `/graphql` Express/Apollo route                                                                                                                                                                                                                                                                                          | [`server/api/dirigera/graphql.post.ts`](../../../server/api/dirigera/graphql.post.ts)                                                                                                                                                             | Replaced by Nitro                           | Handles JSON GraphQL POST requests at `/api/dirigera/graphql`, validates the request envelope, disables caching, and rejects explicit cross-origin browser requests.                                                                               |
| Reference WebSocket JWT query parameter                                                                                                                                                                                                                                                                                            | [`server/api/dirigera/session.get.ts`](../../../server/api/dirigera/session.get.ts), [`server/utils/dirigera-session.ts`](../../../server/utils/dirigera-session.ts), [`server/routes/dirigera-updates.ts`](../../../server/routes/dirigera-updates.ts) | Changed                                     | Uses a separate one-minute update token signed with a random per-process secret. It is not the hub token and not a login session.                                                                                                                  |
| Reference fixed server URL and port                                                                                                                                                                                                                                                                                                | [`server/middleware/dirigera-websocket.ts`](../../../server/middleware/dirigera-websocket.ts)                                                                                                                                                     | Replaced by Nuxt                            | Derives the browser WebSocket URL from the current Nuxt request, allowing HTTP and updates to use the same host.                                                                                                                                   |
| Express static frontend with 30-day `maxAge` and `compression()`                                                                                                                                                                                                                                                                   | Nuxt renderer/build; no explicit matching server setting                                                                                                                                                                                       | Partially replaced                          | Nuxt serves the application, but this repository does not explicitly reproduce the reference static-file cache duration or response-compression middleware. Deployment infrastructure may provide those separately.                                |
| [`codegen.yml`](https://github.com/lpgera/dirigera-web/blob/7f14eace5cd865c6a28f5167665d5fd873898f21/backend/codegen.yml), `resolvers.gen.ts`                                                                                                                                                                                      | No equivalent                                                                                                                                                                                                                                  | Missing tooling                             | The reference generates resolver and context types from the running schema. Nuxt defines the schema and resolver arguments manually, so schema-to-resolver type drift is no longer checked by code generation.                                     |
| `auth.test.ts`, `jwt.test.ts`, `device.test.ts`                                                                                                                                                                                                                                                                                    | [`tests/unit/dirigera-backend.test.ts`](../../../tests/unit/dirigera-backend.test.ts)                                                                                                                                                             | Replaced and expanded for retained behavior | Nuxt tests the unchanged frontend contract, mappings, all current commands, one-snapshot behavior, connection reuse/retry/shutdown, broadcasts, and update-token expiry. Authentication parity is not tested because that subsystem is absent.     |

## GraphQL operation coverage

| Operation                                                                                                 | Coverage                               | Notes                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `rooms`, `room`                                                                                           | Complete                               | Same room selection and alphabetical ordering; nested fields are built eagerly from the operation snapshot. |
| `scenes`, `activateScene`                                                                                 | Complete                               | Same filtering to `userScene` and same library command.                                                     |
| `devicePlayItemImageURL`                                                                                  | Complete with changed failure handling | Same output form, with timeout and generic error masking in Nuxt.                                           |
| `quickControl`                                                                                            | Complete                               | Same light, outlet, and speaker selection and fan-out behavior.                                             |
| `setIsOn`, `setLightLevel`, `setColorTemperature`, `setColorHueAndSaturation`, `setPlayback`, `setVolume` | Complete                               | Same device versus device-set dispatch and attribute payloads.                                              |
| `login`                                                                                                   | Missing                                | It is absent from the Nuxt schema.                                                                          |
| `@loggedIn` protection for all domain operations                                                          | Missing                                | The Nuxt schema contains no directive and the endpoint requires no session credential.                      |

## Material behavior differences

1. **Access control.** The reference backend requires password-derived JWT
   authorization for GraphQL and WebSocket access. The Nuxt backend only
   checks an explicitly supplied browser `Origin` for GraphQL. A direct client
   can omit that header. The update-token endpoint itself has no login gate.
2. **Startup behavior.** The reference creates the hub client and update
   listener before listening for HTTP traffic, so missing configuration or an
   unavailable hub prevents normal startup. Nuxt starts independently and
   opens one shared hub connection on the first GraphQL or WebSocket use; a
   failed initialization can be retried.
3. **Error exposure.** The reference resolvers allow hub errors to flow through
   Apollo. Nuxt converts every root resolver failure into one generic GraphQL
   error, which avoids leaking hub details but also removes error specificity.
4. **GraphQL implementation.** Apollo middleware, executable-schema resolver
   composition, directive transformation, HTTP error metadata, and generated
   resolver types were replaced by `graphql()` and manually typed root
   functions. The domain operations remain, but framework-level behavior is
   not identical.
5. **Server ownership.** Nitro correctly replaces Express, the custom HTTP
   listener, manual upgrade handling, and process signal handlers. These are
   architectural replacements rather than missing product behavior.

## Answer

The migration is complete for the current frontend's domain behavior, but it
is not a complete migration of the reference backend. Before treating the
Nuxt backend as feature-equivalent, decide whether the application remains a
trusted-LAN tool. If it must preserve the reference security boundary, add
authentication for GraphQL and protect issuance of WebSocket update tokens.
Separately, restore GraphQL code generation if compile-time schema/resolver
alignment is a project requirement.
