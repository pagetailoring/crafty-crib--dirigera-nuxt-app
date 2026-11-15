---
createdAt: 2026-10-13
editedAt: 2026-10-13T19:45:08
lastReviewed: 2026-10-13
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
triage: ready-for-agent
---

# Preserve Apollo-supported frontend capabilities

**Status:** ready-for-agent

## Problem Statement

The reference frontend used Apollo Client as more than a GraphQL request
function. Apollo provided shared query state, normalized and persistent caching,
query and mutation lifecycle state, transport configuration, centralized error
handling, authentication-header injection, and explicit refetch controls. The
Nuxt frontend preserves the domain operations through a small `$fetch` client
and `useAsyncData`, but it does not preserve every behavior that surrounded
those operations.

Without an explicit capability inventory, maintainers can incorrectly treat
"the GraphQL calls still work" as complete Apollo parity. They also risk
attributing adjacent behavior to Apollo even when it belonged to authentication
state, WebSocket management, GraphQL code generation, PWA support, or
Storybook.

## Solution

Preserve or deliberately replace every user-visible and operational capability
that the reference frontend obtained through Apollo Client. Treat the
capabilities as requirements rather than requiring Apollo as the implementation
library.

The parity contract covers:

1. execution of the `Rooms`, `Scenes`, `Room`, and
   `DevicePlayItemImageURL` queries;
2. execution of the `Login`, `ActiveScene`, `QuickControl`, `SetIsOn`,
   `SetLightLevel`, `SetColorTemperature`, `SetColorHueAndSaturation`,
   `SetPlayback`, and `SetVolume` mutations;
3. reactive query `data`, loading, and error state exposed to the rendering
   layer;
4. mutation execution with variables and per-operation pending state;
5. one shared normalized cache for GraphQL entities;
6. persistence of the Apollo cache in browser local storage and restoration of
   cached query results after a reload;
7. the default cache-first behavior used by ordinary queries;
8. cache-and-network behavior for current-play-item artwork;
9. explicit query refetch after a WebSocket update and when a hidden page
   becomes visible;
10. a relative same-origin GraphQL endpoint and same-origin credential policy;
11. centralized injection of the current client token through the `x-token`
    header;
12. centralized reporting of GraphQL and transport errors;
13. a centralized authentication-failure reaction that clears the client
    login state when the server reports the known unauthenticated error;
14. a provider-level client boundary through which pages and controls consume
    the same transport, cache, and error policies; and
15. schema-derived operation result and variable types for every GraphQL
    document used by that client boundary.

The persisted query cache contains the room summaries with environmental
readings and quick controls, scene lists, room details with device state, and
current-play-item artwork. Login tokens are not Apollo cache entries: the
reference authentication context stores them separately. Mutation responses
are not treated as durable domain state because the reference defines no
optimistic responses, cache update functions, or mutation-driven
`refetchQueries`; fresh device state arrives through explicit refetches.

## User Stories

1. As a smart-home user, I want the room list to load through the shared
   GraphQL client, so that all pages use the same transport and error policy.
2. As a smart-home user, I want room environmental readings and quick controls
   included in the cached room-list result, so that the complete home summary
   is represented consistently.
3. As a smart-home user, I want the scene list to use the same query-state
   contract, so that loading and successful results behave consistently with
   room data.
4. As a smart-home user, I want room details and device state fetched by room
   identifier, so that navigation supplies the correct GraphQL variables.
5. As a speaker user, I want current-play-item artwork to display cached data
   immediately and still check the network, so that artwork remains responsive
   without silently becoming stale.
6. As a user, I want query loading state exposed to the interface, so that I
   receive feedback while data is unavailable.
7. As a user, I want query errors exposed to the interface, so that a failed
   request is not mistaken for an empty home or room.
8. As a user, I want successful query data to update the rendered interface
   reactively, so that a completed request does not require navigation or a
   reload.
9. As a user, I want a scene activation command to expose its asynchronous
   lifecycle, so that repeated actions can be controlled while the mutation is
   pending.
10. As a user, I want room quick-control commands to preserve their GraphQL
    variables and pending state, so that the intended room and control type are
    changed exactly once per action.
11. As a lighting user, I want power, light level, color temperature, hue, and
    saturation commands to expose pending state, so that affected controls can
    reject overlapping input.
12. As a speaker user, I want playback and volume commands to use the same
    typed mutation boundary, so that device and device-set targets are sent
    consistently.
13. As a returning user, I want previously queried rooms, scenes, room details,
    and artwork restored after a browser reload, so that the interface can
    present known data while fresh data is requested when required.
14. As a user moving between views, I want the same GraphQL entity represented
    once in a shared normalized cache, so that views do not maintain
    contradictory copies of a room or device.
15. As a user, I want ordinary queries to reuse valid cached results before
    issuing unnecessary network requests, so that repeat navigation remains
    responsive.
16. As a smart-home user, I want cached state refreshed after a Dirigera update
    message, so that the interface converges on the current hub state.
17. As a returning browser user, I want mounted queries refreshed when the page
    becomes visible, so that background inactivity does not leave device state
    stale.
18. As an authenticated user, I want the current client token attached to every
    GraphQL request at one transport boundary, so that individual operations do
    not implement authorization independently.
19. As an authenticated user, I want same-origin credentials preserved on
    GraphQL requests, so that browser credentials are not accidentally omitted
    when the deployment uses them.
20. As a user whose authorization has expired, I want the known unauthenticated
    GraphQL response to clear my client login state, so that the application
    does not remain in a misleading authenticated view.
21. As an operator, I want GraphQL and transport failures reported through one
    error boundary, so that failures are diagnosable without adding logging to
    every page and control.
22. As a developer, I want pages and controls to consume one client boundary,
    so that endpoint, credentials, headers, cache policy, and error policy
    cannot drift between operations.
23. As a developer, I want operation variables and results checked against the
    GraphQL schema, so that a schema change fails validation before reaching a
    user.
24. As a maintainer, I want the Apollo capability inventory separated from
    adjacent authentication, WebSocket, PWA, and Storybook responsibilities, so
    that replacement work has an accurate scope.
25. As a maintainer, I want mutation results excluded from durable domain cache
    requirements unless an explicit update policy is introduced, so that the
    replacement does not invent behavior absent from the reference.
26. As a maintainer, I want capability parity verified independently of the
    chosen GraphQL library, so that restoring behavior does not automatically
    force a return to React or Apollo Client.

## Implementation Decisions

- Define parity in terms of observable client capabilities. Apollo Client may
  be reintroduced, or the existing Nuxt data layer may provide equivalent
  behavior, but the library choice is not predetermined by this specification.
- Keep one application-wide GraphQL client boundary responsible for endpoint
  selection, same-origin credentials, authorization headers, error policy, and
  cache policy.
- Preserve all four reference queries and all nine reference mutations with
  their existing variables and GraphQL operation semantics.
- Expose query data, loading, and error state and mutation pending state without
  requiring components to reconstruct request lifecycles independently.
- Use one normalized entity cache shared across home, room, and device
  consumers. Entities that expose stable GraphQL identity must not be copied
  into unrelated per-page stores without an explicit reason.
- Persist only GraphQL query cache data required for parity. Authentication
  tokens remain owned by the authentication boundary and must not be stored as
  cached query data.
- Restore persisted query data before treating the client cache as ready. A
  race between cache restoration and initial queries must not overwrite newer
  network data with older persisted data.
- Preserve cache-first behavior for rooms, scenes, and room details. Preserve
  cache-and-network behavior for current-play-item artwork.
- Keep explicit refresh triggers for update messages and page visibility.
  Cached data is a responsiveness feature, not evidence that live Dirigera
  state is current.
- Do not infer mutation-driven cache changes that the reference did not define.
  Device state remains authoritative only after the existing refresh path
  retrieves it again.
- Centralize GraphQL and transport error reporting. Preserve a typed or stable
  classification for authentication failure rather than scattering literal
  message checks across components.
- Token persistence and the decision to show a login screen belong to the
  authentication subsystem. The GraphQL client owns only consumption of the
  current token and the callback used when authorization becomes invalid.
- Restore schema-derived types for GraphQL operations. Handwritten interfaces
  alone do not prove that selected fields, nullability, variables, and enum
  values still match the server schema.
- Keep the current Nuxt pages, Nuxt UI presentation, server endpoint, and
  Dirigera domain operation names. Capability parity must not recreate the
  reference React component tree.

## Testing Decisions

- Use the highest practical seam: exercise the application GraphQL client
  boundary against a controlled GraphQL transport, then verify the small number
  of user-visible reactions at the existing Nuxt component seam.
- Verify rooms, scenes, room details, and artwork as observable query results,
  including loading, success, error, and variable handling.
- Verify every mutation through the public client interface with its exact
  variables and an observable pending lifecycle. Avoid asserting hook names or
  internal reactive primitives.
- Prove that a repeated cache-first query can use cached data without another
  transport call and that artwork exposes cached data while still performing a
  network refresh.
- Populate the cache, recreate the client, and prove that the supported query
  results are restored from browser storage. Do not include the authentication
  token in the persisted GraphQL cache fixture.
- Query the same identifiable entity through more than one operation and prove
  that a cache update is visible to each consumer through normalized identity.
- Emit an update event and a visibility transition and verify that the relevant
  active queries refetch and replace stale cached values.
- Capture transport requests and verify the relative endpoint, same-origin
  credential policy, current `x-token` value, operation document, and
  variables.
- Return the known unauthenticated GraphQL error and verify one centralized
  logout callback. Return a different GraphQL error and verify reporting
  without logout.
- Verify network failures and GraphQL response errors separately because they
  cross different parts of the client contract.
- Add a schema-contract check that fails when a query field, variable type,
  nullability rule, or enum value no longer matches the server schema.
- Reuse the existing client unit tests and Nuxt page/component tests as prior
  art. Extend them around the client boundary instead of duplicating every
  behavior through low-level cache implementation tests.

## Out of Scope

- Recreating React components, React context, Ant Design, or the reference
  router.
- Treating Apollo Client itself as mandatory when equivalent behavior can be
  provided cleanly by the Nuxt stack.
- Storing JWTs or other client credentials in the GraphQL query cache.
- Designing the password-login form, logout button, route gate, token issuance,
  or backend authorization policy. Those are authentication features adjacent
  to the client transport contract.
- Apollo features unused by the reference: subscriptions, polling, optimistic
  responses, custom mutation cache updates, mutation `refetchQueries`, local
  reactive variables, pagination policies, and SSR cache extraction.
- WebSocket connection establishment or reconnection. Apollo receives only the
  resulting refresh trigger in the reference architecture.
- PWA installation, service-worker asset caching, Storybook scenarios, battery
  icons, and the commit-SHA update link.
- Changing Dirigera domain operations, GraphQL schema behavior, or backend
  resolvers.

## Further Notes

The cache inventory is deliberately narrower than "everything returned by the
server." It contains results of the four queries used by the reference Apollo
client: room summaries, scenes, room/device details, and play-item artwork.
The reference sends mutations through Apollo but does not define optimistic
responses, manual cache writes, custom field policies, or mutation-triggered
`refetchQueries`.

GraphQL code generation is included as part of the reference Apollo-facing
development contract even though it is supplied by GraphQL Code Generator,
not by Apollo Client itself. Token persistence is excluded because it is owned
by the authentication context; only token injection and the centralized
invalid-authentication reaction cross the Apollo client boundary.

## Dependencies

- A product decision is required before implementation on whether the current
  trusted-LAN model intentionally retires browser authentication. Cache,
  lifecycle, error, and type-safety work can be implemented independently.

## Design

- [Frontend migration coverage](../../../research/frontend-migration-coverage.md)

## Resolution

To be completed after delivery.
