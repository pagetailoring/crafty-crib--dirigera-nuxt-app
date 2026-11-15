---
createdAt: 2026-11-15
editedAt: 2026-11-15T12:48:10
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

The PR promises brightness, color temperature, color, and volume controls.
Handlers read event.target.value, but the installed USlider emits a synthetic
Event whose constructor ignores the target option. The resulting null target
causes a TypeError before a command is sent. The review reproduced this in
Node and happy-dom. Tests fabricate an object with target.value and therefore
bypass the real component event.

## Goal

Make all five device sliders send the selected value through the real component interaction.

## Scope

- Fix brightness, color temperature, hue, saturation, and volume value handling.
- Cover the real slider event/model boundary.
- Preserve pending states, reachability checks, and the latest color companion value.

## Out of scope

- Unrelated refactors and other PR review findings.

## Acceptance criteria

- [ ] Each real slider interaction sends the intended numeric value without an exception.
- [ ] Hue and saturation preserve the latest known companion value.
- [ ] Pending and unreachable controls remain disabled as intended.
- [ ] Regression coverage does not fabricate the event shape that concealed the bug.
- [ ] Focused component tests pass without sending commands to a physical hub.

## Open questions

- None.

## Technical notes

`app/components/DeviceControls.vue:60-61`, `:73-74`, `:86-87`, `:100-101`, `:146-147`; slider helper in `tests/nuxt/device-controls.test.ts`. Recheck the installed component contract; do not fix this by editing node_modules.

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
