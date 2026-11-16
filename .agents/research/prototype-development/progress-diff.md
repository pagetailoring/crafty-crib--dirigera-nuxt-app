---
createdAt: 2026-10-14
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
---

# Prototype migration progress diff

## Compared state

The original review compared the backend research/task created at `23c9b5e`,
the frontend research/task created at `b4d6db8`, and the target at
`4a2c32a`. The reference repository remained at
`7f14eace5cd865c6a28f5167665d5fd873898f21`. The reviewed target behavior was
checked against repository source and focused tests, not inferred from package
presence alone.

## 2026-11-15 checkout update

The active target is `4005c9f`. Backend readiness and retryable connection
probing now exist, but structured error retention and schema-derived resolver
types remain open. The home cache remains non-normalized and non-persistent.

The later interface refactor removed `DeviceControls.vue`. Four light sliders
now use numeric model payloads in `device/LightControls.vue`, while playback,
volume, artwork, and last-seen controls are absent from the current device
card. Battery presentation, device filtering, scene editing, and
white-spectrum controls were added. PWA icons and update-socket reconnection
remain open.

The table below is the `4a2c32a` progress snapshot. It is retained as history
and must be read together with this update.

## Progress since the research snapshots

| Area | Current evidence | Diff from the existing research |
| --- | --- | --- |
| Backend runtime | The resolver boundary still replaces every root failure with one generic error and discards the cause ([`server/services/dirigera-api.ts`](../../../server/services/dirigera-api.ts)); the connection is still lazy and retryable, with no readiness contract ([`server/services/dirigera-connection.ts`](../../../server/services/dirigera-connection.ts)); GraphQL remains unauthenticated apart from an `Origin` check and update-token issuance remains unauthenticated ([GraphQL endpoint](../../../server/api/dirigera/graphql.post.ts), [token endpoint](../../../server/api/dirigera/session.get.ts)). | No substantive backend gap has been closed. The backend research remains accurate, and the backend task remains open and current. Changes under `server/` since `23c9b5e` are formatting-only when whitespace is ignored. |
| Shared frontend state | A Pinia store now owns rooms, scenes, room details, artwork, TTL freshness, in-flight deduplication, invalidation, and command refreshes ([`app/stores/cache.ts`](../../../app/stores/cache.ts)); pages consume that store ([home](../../../app/pages/index.vue), [room](../../../app/pages/room/[id].vue)). | The frontend research is stale where it says the target uses only keyed `useAsyncData` and has no client cache. The new cache is shared but not normalized: room summaries, room details, and artwork remain separate records. |
| Persistence and query policies | The persisted-state module is installed ([`nuxt.config.ts`](../../../nuxt.config.ts), [`package.json`](../../../package.json)), but the cache store declares no persistence option ([`app/stores/cache.ts`](../../../app/stores/cache.ts)). At `4a2c32a`, the former `DeviceControls.vue` returned fresh cached artwork and refreshed only when the play item changed. | Browser restoration and Apollo-equivalent normalized persistence remain missing. Ordinary TTL reuse is partial cache-first progress; artwork was not cache-and-network parity. |
| Refresh and errors | WebSocket and visibility events invalidate the store and refresh the active home or room view, and rejected refreshes are now logged ([`app/app.vue`](../../../app/app.vue), [`update-subscription.ts`](../../../app/services/update-subscription.ts)). The socket still has no close/error reconnection path ([`useDirigeraUpdates.ts`](../../../app/composables/useDirigeraUpdates.ts)). | The old claim that the target calls `refreshNuxtData()` without handling rejection is obsolete. Reconnection and centralized GraphQL/authentication error policy remain absent. |
| Controls and device details | At `4a2c32a`, hue and saturation refs followed refreshed props, light/color/volume/playback controls exposed pending disabling, non-paused playback states paused, and unreachable devices rendered `lastSeen`. | Four frontend gaps recorded in the existing research were closed in that snapshot. Later refactoring changed this status. |
| PWA | The target now registers `@vite-pwa/nuxt`, generates a manifest and auto-updating service worker, and verifies production precaching without live-data routes ([`nuxt.config.ts`](../../../nuxt.config.ts), [`verify-pwa-build.mjs`](../../../tools/verify-pwa-build.mjs)). Manifest icons remain commented out. | The statement that PWA support is absent is obsolete. PWA parity is partial until regular and maskable icons are supplied. |

## Task accuracy corrections applied

- The Apollo-capability task now has a current-status section for the mixed
  Pinia, GraphQL, and direct-endpoint implementation
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
- The research and work-task links now include the
  `research/prototype-development/` segment
  ([backend research](./backend-migration-coverage.md),
  [frontend research](./frontend-migration-coverage.md)).

## Snapshot validation

`bun run test -- tests/nuxt/dirigera-cache.test.ts tests/nuxt/device-controls.test.ts tests/unit/dirigera-backend.test.ts tests/unit/update-subscription.test.ts`
passed: 4 files, 32 tests.
