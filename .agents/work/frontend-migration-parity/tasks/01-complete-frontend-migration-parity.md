---
createdAt: 2026-10-13
editedAt: 2026-10-13T23:28:21
lastReviewed: 2026-10-13
status: closed
type: task
assignee: null
claimedAt: null
blockedBy: []
triage: ready-for-agent
---

# Complete selected frontend migration parity

**Status:** closed

## Problem Statement

The Nuxt frontend contains the core Dirigera room and device workflows, but
three selected parts of the reference frontend are incomplete. Users cannot see
when an unreachable device was last available, several device controls do not
preserve the reference interaction behavior during mutations and live data
updates, and the application is no longer installable or available as an
auto-updating offline application shell.

The user wants these three parity gaps completed without restoring the
reference authentication flow or Apollo cache architecture and without taking
on the other differences identified by the frontend migration assessment.

## Solution

Show the last-seen timestamp as part of the unreachable-device status. Restore
the reference behavior for device-control pending states, color companion-value
synchronization, and playback toggling. Add PWA support through the Nuxt PWA
module, including an installable manifest, suitable icons, an auto-updating
service worker, and offline precaching for the application shell and static
assets.

Keep the current Nuxt data layer, GraphQL client, routes, visual component
system, and trusted-LAN access model unchanged.

## User Stories

1. As a smart-home user, I want an unreachable device to show when it was last
   seen, so that I can judge whether the outage is recent or persistent.
2. As a smart-home user, I want the last-seen value presented in my browser's
   local date and time format, so that I can understand it without converting a
   raw timestamp.
3. As a keyboard or assistive-technology user, I want the unreachable status
   and last-seen detail to remain accessible, so that the diagnostic information
   is not available only through a pointer-only interaction.
4. As a lighting user, I want a light-level control disabled while its mutation
   is pending, so that I cannot accidentally issue overlapping changes.
5. As a lighting user, I want color-temperature, hue, and saturation controls
   disabled while their relevant mutation is pending, so that the UI accurately
   represents an in-flight command.
6. As a speaker user, I want the volume control disabled while its mutation is
   pending, so that repeated input does not create conflicting commands.
7. As a user controlling a light from multiple clients, I want incoming hue and
   saturation values to update the local control state, so that my next change
   does not overwrite a newer companion value.
8. As a lighting user, I want changing hue to preserve the latest saturation,
   so that adjusting one dimension does not revert the other.
9. As a lighting user, I want changing saturation to preserve the latest hue,
   so that adjusting one dimension does not revert the other.
10. As a speaker user, I want pressing the central playback control while
    playback is paused to start playback, so that the button behaves as a play
    action.
11. As a speaker user, I want pressing the central playback control for any
    non-paused state to request pause, so that idle, buffering, playing, and
    future non-paused states follow the reference behavior.
12. As a user, I want previous and next availability rules and buffering
    feedback to remain unchanged, so that the parity fix does not regress the
    existing speaker controls.
13. As a returning user, I want to install the application from a supporting
    browser, so that it can be launched like a standalone application.
14. As an installed-app user, I want the application to retain its Dirigera
    name, colors, and appropriate regular and maskable icons, so that the
    installed experience is recognizable.
15. As an installed-app user, I want new application versions to activate
    automatically, so that the application shell does not remain stale.
16. As a user with a temporary network outage, I want the previously built
    application shell and static assets to remain available, so that the app can
    start and present its interface even when live Dirigera data cannot load.
17. As a user, I want live room, device, and control data to remain sourced from
    the current GraphQL API, so that offline support never presents cached
    device state as current state.
18. As a maintainer, I want the three parity fixes covered at existing public
    component and production-build seams, so that tests verify behavior without
    coupling to implementation details.

## Implementation Decisions

- Preserve the current room and device query contract, including the existing
  last-seen field. This work changes presentation only and requires no backend
  schema change.
- Show the localized last-seen date and time together with the unreachable
  state. The information must be available through accessible text or an
  equivalently accessible disclosure, not only a hover-only visual affordance.
- Reuse the current device-controls component rather than splitting each
  control into a new component solely for parity with the React structure.
- Track pending state for light level, color temperature, combined hue and
  saturation, and volume independently enough that the affected control remains
  disabled until its own request settles. Existing power-control pending
  behavior remains intact.
- Always clear a pending state after either success or failure. Do not treat a
  failed mutation as a successful value change.
- Synchronize locally retained hue and saturation values whenever refreshed
  device properties change. Each combined color mutation must use the newest
  known companion value.
- Match the reference playback decision: paused maps to playing, while every
  other playback state maps to paused. Preserve previous/next availability,
  unreachable-device disabling, and buffering feedback.
- Use the Nuxt integration provided by `@vite-pwa/nuxt`; do not wire the generic
  Vite plugin directly into Nuxt.
- Configure automatic service-worker updates and register the generated web app
  manifest through the Nuxt integration.
- Preserve the reference manifest intent: standalone display, Dirigera naming,
  matching theme/background colors, and regular plus maskable application
  icons.
- Precache the generated application shell and static assets. Do not cache
  GraphQL responses, WebSocket traffic, session tokens, or live Dirigera data.
- Keep PWA behavior disabled or non-intrusive in ordinary development when the
  Nuxt integration does not enable its production service worker.
- Do not introduce a custom install prompt or update notification UI. The
  required behavior is browser installation support and automatic updates.
- Retain the existing Nuxt UI visual language and file-based routing. Do not
  recreate the reference React, Ant Design, or hash-router structure.

## Testing Decisions

- Prefer the existing Nuxt component-test seam for user-visible room and device
  behavior. Assert rendered accessibility text, disabled states, emitted
  commands, and command arguments rather than internal refs or watchers.
- Extend the existing room-page coverage with an unreachable device and verify
  that its last-seen value is exposed in a localized, accessible form.
- Extend the existing device-controls coverage with deferred mutation promises
  to prove that light-level, color, and volume controls are disabled while the
  relevant request is pending and restored after success or failure.
- At the device-controls seam, update component properties after mount and then
  change hue or saturation. Assert that the outgoing command preserves the
  newest companion value.
- Cover paused, playing, buffering, and one additional non-paused playback state
  through the rendered central control. Assert the observable command sent for
  each state.
- Preserve the existing tests for power, color temperature, previous/next,
  volume, artwork, readings, and reachability.
- Verify PWA behavior at the production-build boundary. A successful check must
  prove that the build emits a web app manifest and service worker, registers
  the intended auto-update strategy, includes required icon declarations, and
  precaches the application shell/static assets without adding GraphQL or live
  Dirigera responses to runtime caching.
- Do not make a browser's installability badge the sole automated assertion;
  verify the emitted PWA contract and use a supporting browser as a focused
  manual smoke check when needed.

## Out of Scope

- Restoring password login, logout, browser-managed JWT state, or route gating.
- Reintroducing Apollo Client, normalized caching, or persisted Apollo cache.
- Caching GraphQL responses, WebSocket updates, session tokens, or live device
  state for offline use.
- Changing GraphQL operations, backend resolvers, update-token behavior, or the
  trusted-LAN deployment model.
- Adding WebSocket reconnection as part of this task.
- Changing home-page scene/room request coupling or quick-control concurrency.
- Restoring GraphQL code generation, Storybook scenarios, battery icons, or the
  commit-SHA update link.
- Reworking the current component structure to mirror the React source tree.
- Adding a custom PWA installation or update-prompt user interface.

## Further Notes

The three selected work items come from the frontend migration comparison:

1. restore the unreachable-device last-seen detail;
2. restore device-control interaction parity for pending state, color
   synchronization, and playback behavior;
3. restore installable, auto-updating PWA behavior through the Nuxt-specific PWA
   integration.

The frontend migration comparison remains the source analysis for this scope.
The Nuxt PWA integration is documented by the Vite PWA project at
<https://vite-pwa-org.netlify.app/frameworks/nuxt>.

## Dependencies

- None. This task can start immediately.

## Design

- [Frontend migration coverage](../../../research/frontend-migration-coverage.md)

## Resolution

To be completed after delivery.
