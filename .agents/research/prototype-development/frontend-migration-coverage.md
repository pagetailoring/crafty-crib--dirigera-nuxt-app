---
createdAt: 2026-10-13
lastReviewed: 2026-11-15
editedAt: 2026-11-15T13:23:47
---

# Frontend migration coverage

## Question and scope

This report compares the React reference frontend in
[/Users/pagetailoring/WIP/home/dirigera-web--lpgera/frontend](/Users/pagetailoring/WIP/home/dirigera-web--lpgera/frontend)
with a Nuxt application snapshot.

The reviewed snapshots are:

- reference repository commit 7f14eace5cd865c6a28f5167665d5fd873898f21;
- target repository commit 4a2c32a0e5823ca4dda5a9bc1a6fbc12c3309a33.

The reference frontend still matches the named commit. Its staged changes are
outside frontend source. Generated build output and node_modules are excluded.
Repository source, tests, and generated production artifacts are the primary
sources for this assessment.

## 2026-11-15 checkout review

The active target is now commit `4005c9f`. The former
`app/components/DeviceControls.vue` was removed. Current room and device views
use raw Dirigera-device data from Nitro endpoints and render
`device/ItemCard.vue` with `device/LightControls.vue`. The four light sliders
consume numeric `update:model-value` payloads and throttle commands, but the
current device card no longer provides playback, volume, artwork, or localized
last-seen controls. Battery presentation is now implemented.

The Pinia cache still serves the home view, while newer room, device, scene,
and white-spectrum views use additional direct endpoints. The cache remains
non-normalized and non-persistent. Automatic WebSocket reconnect, centralized
GraphQL error classification, schema-derived operation types, browser
authentication, and PWA manifest icons remain absent from this checkout.

The application now includes device filtering, scene browsing and editing,
and white-spectrum controls that were outside the original comparison. The
snapshot report below remains useful as migration history, but its statements
about the former device controls and missing battery display are not current.

## Snapshot verdict

The migration is still not behaviorally complete, but the previous report
understated the current target substantially.

At the reviewed snapshot, the Nuxt application preserved the core room, scene,
device, artwork,
control, loading, error, empty-state, update, and visibility-refresh workflows.
Since the prior target snapshot, it has also added a shared Pinia cache,
30-second freshness windows, in-flight request deduplication, mutation
verification, per-control pending state, color-state resynchronization,
reference-compatible playback toggling, the unreachable-device last-seen
detail, route-scoped refreshes, rejected-refresh reporting, and a production
PWA service worker.

The remaining material gaps are browser authentication, normalized entity
identity, durable query-cache restoration, Apollo-style cache-and-network
artwork behavior, automatic WebSocket reconnect, centralized GraphQL error and
authentication-failure handling, schema-derived operation types, Storybook
scenarios, battery icons, and PWA manifest icons.

## Current structure mapping

| Reference responsibility | Current Nuxt counterpart | Status | Current evidence |
| --- | --- | --- | --- |
| React root, router, and frame | [app/app.vue](../../../app/app.vue) and file-based pages | Changed | Nuxt owns bootstrapping and history routing. The shared header exists, while the home icon, logout action, and token gate remain absent. |
| Authentication context, login, and logout | No counterpart | Missing | The target has no browser token store, login mutation, authenticated route gate, logout action, x-token injection, or authentication-failure recovery. |
| Apollo transport boundary | [graphql-request.ts](../../../app/services/graphql-request.ts), [dirigera-client.ts](../../../app/services/dirigera-client.ts), and [cache.ts](../../../app/stores/cache.ts) | Partially replaced | The endpoint, operations, app-facing types, shared query state, freshness policy, and mutation orchestration are centralized. Authentication headers, typed GraphQL errors, schema-derived types, and a single long-lived transport object are not present. |
| Apollo normalized cache | [cache.ts](../../../app/stores/cache.ts) | Partial | Pinia stores rooms, scenes, room details, and artwork in one application store with TTL reuse and in-flight deduplication. It stores separate query-shaped records rather than normalized entities. |
| Apollo cache persistence | Pinia persisted-state module registration only | Missing | The module is registered in [nuxt.config.ts](../../../nuxt.config.ts), but the cache store does not opt into persistence. No query cache is restored after reload. |
| Apollo cache-first queries | Pinia TTL reads | Changed | A fresh entry is reused without transport, but it expires after 30 seconds. This is a time-bounded cache policy rather than Apollo's ordinary cache-first policy. |
| Artwork cache-and-network | Pinia artwork entry | Missing | Artwork is reused while fresh and refreshed when the play item changes. A cache hit does not always emit cached data and also start a network request. |
| WebSocket update provider | [useDirigeraUpdates.ts](../../../app/composables/useDirigeraUpdates.ts) and [update-subscription.ts](../../../app/services/update-subscription.ts) | Changed | Update messages and visibility changes refresh the active route. A disconnected socket is not reopened automatically. |
| Query refetch hook | [app/app.vue](../../../app/app.vue) | Transferred with changed scope | Refresh invalidates all cache entries, reloads home or the active room, and reports rejected refreshes. This is route-scoped rather than per-mounted-Apollo-query refetching. |
| Rooms and scenes | [index.vue](../../../app/pages/index.vue) and [cache.ts](../../../app/stores/cache.ts) | Transferred | The target preserves list, loading, error, activation, quick-control, environmental, and navigation behavior. Home loading still awaits rooms and scenes together, so one rejection produces the shared error state. |
| Room and device presentation | [room/[id].vue](../../../app/pages/room/[id].vue) | Transferred with presentation differences | Device state, sensor readings, reachability, localized last-seen time, empty state, and navigation are present. Reference battery icons remain absent. |
| Device controls | `app/components/DeviceControls.vue` at `4a2c32a` | Transferred at the snapshot | All six control families were present. Hue and saturation resynchronized from props, pending controls disabled overlapping input, and non-paused playback states followed the reference pause behavior. |
| GraphQL generated types | Handwritten types in [dirigera-client.ts](../../../app/services/dirigera-client.ts) | Changed | Runtime operations are represented, but no schema-derived build-time contract checks query fields, variables, nullability, or enums. |
| Storybook scenarios | No counterpart | Missing | The reference's frame and device scenarios and GraphQL mocks have not been transferred. |
| PWA runtime and manifest | [nuxt.config.ts](../../../nuxt.config.ts), [app.vue](../../../app/app.vue), and [verify-pwa-build.mjs](../../../tools/verify-pwa-build.mjs) | Mostly transferred | The target registers an auto-updating service worker, emits a manifest, and precaches built static assets while excluding live GraphQL and WebSocket data. Manifest icons are still commented out and absent. |

## Progress since the previous target snapshot

The previous report used target commit
23c9b5e2925d8e46be9ff32423fd1fd52554e40c. The following findings have changed
at the reviewed target commit.

### Resolved

- PWA registration, static-asset precaching, manifest generation, update
  activation, and production-artifact verification now exist
  ([nuxt.config.ts](../../../nuxt.config.ts),
  [verify-pwa-build.mjs](../../../tools/verify-pwa-build.mjs)).
- Last-seen information is rendered for unreachable devices
  ([room/[id].vue](../../../app/pages/room/[id].vue)).
- Hue and saturation companion values tracked refreshed device props in
  `app/components/DeviceControls.vue` at `4a2c32a`.
- Playback toggling matched the reference at `4a2c32a`: paused became playing
  and every other exposed state became paused.
- Light level, color temperature, color, playback, and volume exposed separate
  pending states and rejected overlapping control input at `4a2c32a`.
- Update-triggered refreshes now invalidate the cache, reload the active route,
  and retain a visible console failure instead of dropping a rejected promise
  ([app.vue](../../../app/app.vue)).

### Partially resolved

- A shared Pinia cache now owns query-shaped room, scene, room-detail, and
  artwork entries, deduplicates concurrent loads, and verifies changed device
  state after mutation. It is not a normalized entity cache
  ([cache.ts](../../../app/stores/cache.ts),
  [dirigera-cache.test.ts](../../../tests/nuxt/dirigera-cache.test.ts)).
- The persisted-state integration is installed and registered, but the cache
  store has no persistence configuration. Reload restoration remains absent
  ([nuxt.config.ts](../../../nuxt.config.ts),
  [cache.ts](../../../app/stores/cache.ts)).
- PWA behavior is implemented, but regular and maskable manifest icons remain
  absent ([nuxt.config.ts](../../../nuxt.config.ts)).
- Query and mutation lifecycle state is broader than before, but errors are
  still handled by pages or console calls rather than one typed application
  boundary.

### Still unresolved

- Authentication and x-token behavior.
- Automatic WebSocket reconnection.
- Normalized and durable GraphQL cache parity.
- Cache-and-network artwork semantics.
- Centralized transport and GraphQL error classification.
- Schema-derived operation and resolver contracts.
- Storybook scenarios and battery icons at the reviewed snapshot. Battery
  presentation was added later.

## Accuracy of the existing frontend work task

[Preserve Apollo-supported frontend capabilities](../../work/apollo-supported-frontend-capabilities/tasks/01-preserve-apollo-supported-frontend-capabilities.md)
remains directionally current as a parity specification, but it no longer
describes a zero-progress state.

Capabilities for a shared cache boundary, reactive state, pending state,
cache reuse, explicit update and visibility refresh, and mutation verification
now have partial or substantial implementations. The task remains accurate that
normalized identity, durable restoration, cache-and-network artwork,
authentication consumption, centralized error handling, and schema-derived
operation types are missing.

The task now includes a current-status section for the mixed Pinia, GraphQL,
and direct-endpoint implementation. Its instruction not to infer
mutation-driven cache changes still needs a decision: the current store applies
successful device commands to cached room data before forcing a verification read
([cache.ts](../../../app/stores/cache.ts)). The task should either accept that
post-success local update or require its removal.

The task's login and x-token requirements cannot be completed independently of
the product decision it already names: the current backend intentionally
removed browser authentication for the trusted-LAN phase. The task's
current-status section now separates delivered and missing capabilities, but
the authentication product decision remains open.

## Bottom line

The frontend remains closer to the reference than the first research snapshot,
but later interface work removed some delivered device behavior. Current work
must cover cache persistence and normalization, cache-and-network artwork,
update reconnect, centralized errors, schema-derived types, the authentication
decision, PWA icons, and the missing playback, volume, artwork, and last-seen
interface behavior.
