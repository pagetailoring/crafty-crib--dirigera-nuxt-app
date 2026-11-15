---
createdAt: 2026-11-15
editedAt: 2026-11-15T12:48:10
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P3
reviewAxis: standards
---

# Review repeated device command mapping

## Description

Possible Repeated Switches: the transport client and cache both enumerate
command.type and map its fields. New variants require updates in both places;
applyDeviceCommand can silently omit a variant. This is a design observation,
not a documented-standard violation.

## Goal

Make command coverage explicit while keeping transport and cache responsibilities separate.

## Scope

- Evaluate an exhaustive mapping or shared field description.
- Preserve command payloads and post-command refresh behavior.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [ ] Each command has an explicit transport and cache policy.
- [ ] An unhandled variant cannot silently bypass the cache update policy.
- [ ] Existing command and cache behavior remains covered by focused checks.

## Open questions

- Is exhaustive handling sufficient, or is shared field metadata justified?

## Technical notes

`app/services/dirigera-client.ts:252-295` and `app/stores/cache.ts:152-165`. Avoid a broad command framework solely to remove repetition.

Review evidence refers to commit `67bb02e85556ff7be4c7d01fe6f8ea40fd044320`.
The suite passed 52 tests across 9 files during review; this does not establish
browser or physical-device behavior.

## Dependencies

- None.

## Design

- [PR #5](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/5).
- Review axis: standards. The user selected the GitHub PR description as the
  requirements source. Open migration tasks are not additional requirements.

## Resolution

To be completed after delivery.
