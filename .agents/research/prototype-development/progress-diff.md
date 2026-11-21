---
createdAt: 2026-10-14
editedAt: 2026-10-14T00:08:00
lastReviewed: 2026-10-14
---

# Prototype migration progress diff

## Compared state

This review compares the backend research/task created at `23c9b5e`, the
frontend research/task created at `b4d6db8`, and the current target at
`4a2c32a`. The reference repository remains at
`7f14eace5cd865c6a28f5167665d5fd873898f21`. The current target behavior was
checked against repository source and focused tests, not inferred from package
presence alone.

## Progress since the research snapshots

| Area | Current evidence | Diff from the existing research |
| --- | --- | --- |
| Backend runtime | The resolver boundary still replaces every root failure with one generic error and discards the cause ([`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)); the connection is still lazy and retryable, with no readiness contract ([`server/services/dirigera-connection.ts`](../../../server/services/dirigera-connection.ts)); GraphQL remains unauthenticated apart from an `Origin` check and update-token issuance remains unauthenticated ([GraphQL endpoint](../../../server/api/dirigera/graphql.post.ts), [token endpoint](../../../server/api/dirigera/session.get.ts)). | No substantive backend gap has been closed. The backend research remains accurate, and the backend task remains open and current. Changes under `server/` since `23c9b5e` are formatting-only when whitespace is ignored. |
| Shared frontend state | A Pinia store now owns rooms, scenes, room details, artwork, TTL freshness, in-flight deduplication, invalidation, and command refreshes ([`app/stores/cache.ts`](../../../app/stores/cache.ts)); pages consume that store ([home](../../../app/pages/index.vue), [room](../../../app/pages/room/[id].vue)). | The frontend research is stale where it says the target uses only keyed `useAsyncData` and has no client cache. The new cache is shared but not normalized: room summaries, room details, and artwork remain separate records. |
| Persistence and query policies | The persisted-state module is installed ([`nuxt.config.ts`](../../../nuxt.config.ts), [`package.json`](../../../package.json)), but the cache store declares no persistence option ([`app/stores/cache.ts`](../../../app/stores/cache.ts)). Artwork returns fresh cached data without a network request and only forces a refresh when the play item changes ([`DeviceControls.vue`](../../../app/components/DeviceControls.vue)). | Browser restoration and Apollo-equivalent normalized persistence remain missing. Ordinary TTL reuse is partial cache-first progress; artwork is not cache-and-network parity. |
| Refresh and errors | WebSocket and visibility events invalidate the store and refresh the active home or room view, and rejected refreshes are now logged ([`app/app.vue`](../../../app/app.vue), [`update-subscription.ts`](../../../app/services/update-subscription.ts)). The socket still has no close/error reconnection path ([`useDirigeraUpdates.ts`](../../../app/composables/useDirigeraUpdates.ts)). | The old claim that the target calls `refreshNuxtData()` without handling rejection is obsolete. Reconnection and centralized GraphQL/authentication error policy remain absent. |
| Controls and device details | Hue/saturation refs now follow refreshed props, light/color/volume/playback controls expose pending disabling, non-paused playback states now pause, and unreachable devices render `lastSeen` ([`DeviceControls.vue`](../../../app/components/DeviceControls.vue), [`room/[id].vue`](../../../app/pages/room/[id].vue)). | Four frontend gaps recorded in the existing research are closed: stale color companions, missing pending states, idle/buffering playback semantics, and missing `lastSeen`. |
| PWA | The target now registers `@vite-pwa/nuxt`, generates a manifest and auto-updating service worker, and verifies production precaching without live-data routes ([`nuxt.config.ts`](../../../nuxt.config.ts), [`verify-pwa-build.mjs`](../../../tools/verify-pwa-build.mjs)). Manifest icons remain commented out. | The statement that PWA support is absent is obsolete. PWA parity is partial until regular and maskable icons are supplied. |

## Task accuracy corrections

- The Apollo-capability task still describes the target as `$fetch` plus
  `useAsyncData`; it should describe the shared Pinia cache and mark TTL reuse,
  request deduplication, route-scoped refresh, and pending state as delivered
  ([task](../../work/apollo-supported-frontend-capabilities/tasks/01-preserve-apollo-supported-frontend-capabilities.md),
  [store](../../../app/stores/cache.ts)).
- That task says not to infer mutation-driven cache changes, but the current
  store writes successful device commands into cached room data before the
  forced verification read. The specification should either accept this
  post-success local update or require its removal ([task](../../work/apollo-supported-frontend-capabilities/tasks/01-preserve-apollo-supported-frontend-capabilities.md),
  [store](../../../app/stores/cache.ts)).
- Authentication requirements in the Apollo task remain blocked by the stated
  product decision: the backend task deliberately retains the trusted-LAN,
  no-login model for this phase ([frontend task](../../work/apollo-supported-frontend-capabilities/tasks/01-preserve-apollo-supported-frontend-capabilities.md),
  [backend task](../../work/backend-migration-regressions/tasks/01-address-backend-migration-regressions.md)).
- Moving both research files one directory deeper initially invalidated their
  repository links; those links are corrected in the updated research. Both
  work-task Design links still point to the former research locations and need
  the new `research/prototype-development/` segment
  ([backend research](./backend-migration-coverage.md),
  [frontend research](./frontend-migration-coverage.md)). They were deliberately
  left unchanged because the current request keeps `.agents/work` read-only.

## Validation

`bun run test -- tests/nuxt/dirigera-cache.test.ts tests/nuxt/device-controls.test.ts tests/unit/dirigera-backend.test.ts tests/unit/update-subscription.test.ts`
passed: 4 files, 32 tests.
