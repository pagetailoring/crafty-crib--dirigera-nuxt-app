---
createdAt: 2026-10-13
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
status: open
type: research
assignee: null
claimedAt: null
blockedBy: []
---

# Investigate the Dirigera color model

## Description

The application sends hue and saturation together when either color control
changes. Incoming device updates must therefore refresh both retained values so
that the next command does not overwrite its companion value with stale data.
Current tests cover refreshed saturation followed by a hue change, but not the
inverse case of refreshed hue followed by a saturation change.

The reference frontend also has incorrect or incomplete color-handling logic.
It is not yet clear whether the reference implementation is incomplete or the
`dirigera` library exposes an incomplete color model or command API.

At target commit `4005c9f`, `device/LightControls.vue` synchronizes hue and
saturation from refreshed device attributes and sends both values in each color
command. The current component tests do not cover both synchronization
directions, and the library and gateway semantics have not been investigated.
The issue therefore remains open.

## Goal

Determine the correct color-control behavior and identify whether the gap is in
the reference frontend, the `dirigera` library, or both.

## Scope

- Compare color state and mutation behavior in this application and the
  reference frontend.
- Inspect the installed `dirigera` library API, implementation, and relevant
  upstream documentation.
- Establish the supported hue and saturation ranges, update semantics, and
  command requirements.
- Recommend the expected application behavior and the tests needed to protect
  it.

## Out of scope

- Changing the color controls or their tests.
- Replacing or patching the `dirigera` library.
- Expanding the investigation to unrelated device capabilities.

## Acceptance criteria

- [ ] The current application and reference behavior are documented with code
      evidence.
- [ ] The installed library's supported color fields and commands are verified
      from its implementation and primary upstream sources.
- [ ] The investigation states whether the reference frontend, the library, or
      both are incomplete.
- [ ] A concrete expected behavior and test plan are recorded.
- [ ] The test plan covers both companion-value synchronization directions.

## Open questions

- Does the Dirigera gateway require hue and saturation to be sent together?
- Can the installed `dirigera` library update either value independently?
- Are the reference frontend's defaults, ranges, and companion-value handling
  correct for every supported color-capable device?

## Technical notes

Use the repository's installed `dirigera` version, currently `2.0.2`, as the
initial implementation boundary. Treat the reference frontend as behavior to
investigate, not as an automatically correct specification.

## Dependencies

- None.

## Design

- [Archived frontend migration parity task](../../archive/frontend-migration-parity/tasks/01-complete-frontend-migration-parity.md)

## Resolution

To be completed after the investigation.
