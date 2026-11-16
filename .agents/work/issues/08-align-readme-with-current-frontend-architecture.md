---
createdAt: 2026-11-16
editedAt: 2026-11-16T14:26:47
lastReviewed: 2026-11-16
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P2
reviewAxes:
  - standards
  - spec
---

# Align README with the current frontend architecture

## Description

PR #6 adds new interface views, frontend features, and direct Nitro data paths,
but the README still says that frontend files and functionality are unchanged
and that new frontend features are outside the migration. It also presents the
GraphQL contract as the sole frontend data path even though the device, room,
and scene views call direct Nitro endpoints.

This is one underlying documentation defect reported by both the Standards and
Spec review axes.

## Goal

Make the setup and architecture documentation describe the application shipped
by PR #6.

## Scope

- Remove or revise statements that describe the frontend as unchanged.
- Document the current division between the GraphQL client, Pinia cache, and
  direct Nitro endpoints.
- Keep setup and deployment instructions consistent with the current routes and
  server-owned DIRIGERA credentials.

## Out of scope

- Changing frontend data-loading behavior.
- Consolidating GraphQL and direct Nitro data paths.
- Expanding setup documentation beyond the features and architecture already in
  the application.

## Acceptance criteria

- [ ] The README no longer says that frontend files and functionality are
      unchanged or that new frontend features are outside the migration.
- [ ] The README identifies the GraphQL-backed cache and direct Nitro endpoints
      used by the current views.
- [ ] The documented setup and deployment steps remain accurate for the
      server-side hub token and WebSocket forwarding.
- [ ] The README does not claim verification beyond the checks that were run.

## Open questions

- None.

## Technical notes

Review target: PR #6 at `620d8d8270c6dbde19345a63ca4a932fea877239`,
compared with base commit `c752a208d8a3469bd0889fb11eac0d94ddbc1fdd`.
The conflicting README statements are near lines 66 and 81. Direct endpoint
usage appears in `app/pages/devices.vue` and `app/pages/room/[id].vue`.

## Dependencies

- None.

## Design

- [PR #6](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/6)
- Review axes: Standards and Spec.

## Resolution

To be completed after delivery.
