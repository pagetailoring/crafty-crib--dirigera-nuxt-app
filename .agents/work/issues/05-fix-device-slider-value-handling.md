---
createdAt: 2026-11-15
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P1
reviewAxis: spec
---

# Fix device slider value handling

## Description

At review commit `67bb02e`, the five sliders read `event.target.value`. The
installed `USlider` did not supply that target, so a real interaction failed
before sending a command. The tests concealed the defect with fabricated event
objects.

Commit `8cf0b63` changed the old component to consume numeric
`update:model-value` payloads. Commit `fc20572` later replaced it with
`device/LightControls.vue`. At target commit `4005c9f`, the four light sliders
use the numeric payload correctly and queue throttled commands. The volume
slider and playback controls no longer exist in the rendered device card,
although PRs #5 and #6 still promise media controls. The issue remains open for
that unresolved part of the original scope and for focused coverage of all
four current light sliders.

## Goal

Keep the corrected Nuxt UI slider boundary and resolve the missing media-control
part of the published PR scope.

## Scope

- Cover brightness, color temperature, hue, and saturation through numeric
  `update:model-value` payloads.
- Preserve reachability checks, throttled command delivery, and the latest
  color companion value.
- Decide whether to restore the promised volume and playback controls. If they
  are restored, use the same real component boundary for volume.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [x] Current light sliders consume numeric `update:model-value` payloads
      without reading `event.target`.
- [ ] Focused component coverage exercises brightness, color temperature, hue,
      and saturation through that boundary.
- [ ] Hue and saturation preserve the latest known companion value in both
      update directions.
- [ ] Unreachable controls remain disabled and throttling keeps the latest
      queued value.
- [ ] The published media-control scope is restored or explicitly revised.
- [ ] Focused component tests pass without sending commands to a physical hub.

## Open questions

- Should the current device card restore playback, volume, and artwork controls,
  or should the published PR scope be revised?

## Technical notes

Current implementation: `app/components/device/LightControls.vue:127-149` and
`:158-206`. Current coverage exercises the light-level model payload in
`tests/nuxt/device-item-card.test.ts:181-194`, but not every light slider or
both color synchronization directions. Do not fix component behavior by
editing `node_modules`.

Review evidence refers to commit `67bb02e85556ff7be4c7d01fe6f8ea40fd044320`.
The suite passed 52 tests across 9 files during review; this does not establish
browser or physical-device behavior.

## Dependencies

- None.

## Design

- [PR #5](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/5).
- [PR #6](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/6).
- Review axis: spec. The user selected the GitHub PR description as the
  requirements source. Open migration tasks are not additional requirements.

## Resolution

To be completed after delivery.
