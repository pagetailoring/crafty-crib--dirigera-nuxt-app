---
createdAt: 2026-10-13
lastReviewed: 2026-10-14
editedAt: 2026-10-14T00:08:00
---

# Frontend migration coverage

## Question and scope

This report compares the React reference frontend in
[/Users/pagetailoring/WIP/home/dirigera-web--lpgera/frontend](/Users/pagetailoring/WIP/home/dirigera-web--lpgera/frontend)
with the current Nuxt application.

The reviewed snapshots are:

- reference repository commit 7f14eace5cd865c6a28f5167665d5fd873898f21;
- target repository commit 4a2c32a0e5823ca4dda5a9bc1a6fbc12c3309a33.

The reference frontend still matches the named commit. Its staged changes are
outside frontend source. Generated build output and node_modules are excluded.
Repository source, tests, and generated production artifacts are the primary
sources for this assessment.

## Verdict

The migration is still not behaviorally complete, but the previous report
understated the current target substantially.

The current Nuxt application preserves the core room, scene, device, artwork,
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
| Device controls | [DeviceControls.vue](../../../app/components/DeviceControls.vue) | Transferred | All six control families are present. Hue and saturation now resynchronize from props, pending controls disable overlapping input, and non-paused playback states now follow the reference pause behavior. |
| GraphQL generated types | Handwritten types in [dirigera-client.ts](../../../app/services/dirigera-client.ts) | Changed | Runtime operations are represented, but no schema-derived build-time contract checks query fields, variables, nullability, or enums. |
| Storybook scenarios | No counterpart | Missing | The reference's frame and device scenarios and GraphQL mocks have not been transferred. |
| PWA runtime and manifest | [nuxt.config.ts](../../../nuxt.config.ts), [app.vue](../../../app/app.vue), and [verify-pwa-build.mjs](../../../tools/verify-pwa-build.mjs) | Mostly transferred | The target registers an auto-updating service worker, emits a manifest, and precaches built static assets while excluding live GraphQL and WebSocket data. Manifest icons are still commented out and absent. |

## Progress since the previous target snapshot

The previous report used target commit
23c9b5e2925d8e46be9ff32423fd1fd52554e40c. The following findings have changed
at the current target commit.

### Resolved

- PWA registration, static-asset precaching, manifest generation, update
  activation, and production-artifact verification now exist
  ([nuxt.config.ts](../../../nuxt.config.ts),
  [verify-pwa-build.mjs](../../../tools/verify-pwa-build.mjs)).
- Last-seen information is rendered for unreachable devices
  ([room/[id].vue](../../../app/pages/room/[id].vue)).
- Hue and saturation companion values track refreshed device props
  ([DeviceControls.vue](../../../app/components/DeviceControls.vue)).
- Playback toggling now matches the reference: paused becomes playing and every
  other exposed state becomes paused
  ([DeviceControls.vue](../../../app/components/DeviceControls.vue)).
- Light level, color temperature, color, playback, and volume expose separate
  pending states and reject overlapping control input
  ([DeviceControls.vue](../../../app/components/DeviceControls.vue)).
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
- Storybook scenarios and battery icons.

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

The task's current implementation summary is stale where it still describes
the target as useAsyncData-based. Its instruction not to infer mutation-driven
cache changes also needs a decision: the current store applies successful
device commands to cached room data before forcing a verification read
([cache.ts](../../../app/stores/cache.ts)). The task should either accept that
post-success local update or require its removal.

The task's login and x-token requirements cannot be completed independently of
the product decision it already names: the current backend intentionally
removed browser authentication for the trusted-LAN phase. Its implementation
status should therefore distinguish implemented, partial, blocked, and missing
capabilities before development starts. This report does not modify the task.

## Bottom line

The frontend is materially closer to the reference than the earlier research
reported. The next parity work is no longer “add caching and PWA” in general;
it is to finish the exact missing semantics: persistence opt-in and restoration,
normalization, cache-and-network artwork, reconnect, centralized errors,
schema-derived types, authentication decision, PWA icons, and remaining support
scenarios.
