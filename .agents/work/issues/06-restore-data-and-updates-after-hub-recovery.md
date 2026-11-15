---
createdAt: 2026-11-15
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P2
reviewAxis: spec
---

# Restore data and updates after hub recovery

## Description

The PR promises automatic and manual retries and active-view refreshes on hub
changes. At target commit `4005c9f`, a retry refreshes only connection status.
Recovery removes the warning but does not reload failed page data or recreate a
closed update WebSocket. The page can remain empty and miss updates until it is
reloaded.

The current application also has device, scene, scene-detail, and
white-spectrum routes. The refresh callback in `app/app.vue` distinguishes only
the room route from all other routes, so recovery and update behavior must be
verified for each data-loading path rather than treating every non-room route
as the home view.

## Goal

Recover active-view data and live updates after a startup hub outage without a page reload.

## Scope

- Handle recovery through automatic and manual retry.
- Reload active-view data and clear recovered page errors.
- Restore the update subscription with a valid token and clean up obsolete subscriptions.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [ ] Automatic recovery reloads the active home or room view with a controlled backend.
- [ ] Manual Retry restores the same behavior.
- [ ] A subsequent hub update refreshes the active view through a working subscription.
- [ ] Recovery clears obsolete page errors.
- [ ] Recovery does not accumulate duplicate sockets, listeners, or retry timers.

## Open questions

- None.

## Technical notes

`app/app.vue:25-57`, `app/composables/useDirigeraUpdates.ts:7-26`,
`app/services/update-subscription.ts`, and
`server/routes/dirigera-updates.ts`. Use a controlled backend; real-device
mutations are unnecessary. The reconnect implementation on
`refactor/s1.2--before-errors-handling` is not part of the current checkout.

Review evidence refers to commit `67bb02e85556ff7be4c7d01fe6f8ea40fd044320`.
The suite passed 52 tests across 9 files during review; this does not establish
browser or physical-device behavior.

## Dependencies

- None.

## Design

- [PR #5](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/5).
- Review axis: spec. The user selected the GitHub PR description as the
  requirements source. Open migration tasks are not additional requirements.

## Resolution

To be completed after delivery.
