---
createdAt: 2026-11-15
editedAt: 2026-11-15T12:48:10
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P2
reviewAxis: spec
---

# Preserve cache invalidation during in-flight loads

## Description

The PR promises deduplication, invalidation, and refresh after commands.
A forced refresh joins an existing request even when invalidation or a
completed command happened after that request began. The old response then
writes stale: false. The review reproduced this with the real store and a
controlled client: start a read, invalidate, force refresh, resolve the old
read. Only one request runs and the old snapshot is marked fresh.

## Goal

Ensure changes observed during an in-flight load are not lost when that load completes.

## Scope

- Preserve invalidation or schedule a follow-up read when forced refresh overlaps an older request.
- Cover hub updates and completed device commands.
- Apply the rule consistently to loaders sharing the deduplication mechanism.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [ ] An update during a pending read cannot leave the old snapshot marked fresh without a subsequent refresh.
- [ ] A successful command overlapping a prior read obtains a post-command refresh.
- [ ] Concurrent ordinary reads still share one request.
- [ ] Failure clears pending state and allows a later retry.
- [ ] Controlled-promise tests cover ordering without a physical hub.

## Open questions

- None.

## Technical notes

`app/stores/cache.ts:44-54`, `:93-104`, and invalidation/post-command refresh paths. Do not expand this into cache persistence or normalization work.

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
