---
createdAt: 2026-11-15
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P3
reviewAxis: standards
---

# Review shared device data mapping

## Description

Possible Duplicated Code: getDevicesNotInSet and getDeviceSets separately map
sensor readings and playback metadata. The device mapping includes co2 while
the set mapping omits it. This is a design observation, not a violation of a
documented rule or proof that sets must expose CO2.

## Goal

Keep shared mappings consistent while preserving intentional device-set semantics.

## Scope

- Compare shared fields and decide which mappings can be shared.
- Preserve device-set aggregation and device capability checks.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [ ] Shared and intentionally different fields are identified.
- [ ] The CO2 difference is assessed explicitly.
- [ ] Any extraction preserves existing behavior and relevant backend tests pass.

## Open questions

- Which differences are intentional for device sets?

## Technical notes

At target commit `4005c9f`, the duplication remains in
`server/services/dirigera-home.ts:21-64` and `:79-149`. Device views include
CO2, while device-set views still omit it. Do not force identical mappings
where domain semantics differ.

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
