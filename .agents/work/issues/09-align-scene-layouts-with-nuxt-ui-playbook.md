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
reviewAxis: standards
---

# Align scene layouts with the Nuxt UI playbook

## Description

PR #6 builds parts of the scenes page and scene cards with custom HTML layout
elements and Tailwind classes. The project Nuxt UI playbook requires library
components for headers, layout, separators, and button groups. It permits
custom markup or styling only after checking the component API and agreeing on
the required exception.

No approved exception is recorded for the reviewed scene layouts.

## Goal

Bring the reviewed scene layouts into documented Nuxt UI compliance without an
unrequested visual redesign.

## Scope

- Review the page header, action group, and scene grid in
  `app/pages/scenes/index.vue` against the available Nuxt UI components.
- Review the custom layout in `app/components/scenes/SceneCard.vue` against the
  same playbook.
- Replace custom structures where Nuxt UI expresses the existing layout, or
  obtain and record approval for each necessary exception.

## Out of scope

- Redesigning the scenes interface.
- Changing scene editing or activation behavior.
- Refactoring unrelated custom layouts across the application.

## Acceptance criteria

- [ ] The relevant Nuxt UI component APIs and existing project adapters are
      checked before implementation.
- [ ] The reviewed header, action group, grid, and card layout use Nuxt UI
      components where those components can preserve the current behavior.
- [ ] Every remaining custom markup or styling exception has an explicit,
      recorded justification approved by the user.
- [ ] Focused scene component tests and the repository validation checks pass.
- [ ] Any manual visual verification performed is reported separately from
      automated validation.

## Open questions

- Which reviewed structures cannot be represented by the current Nuxt UI APIs
  without changing the intended layout?

## Technical notes

Review target: PR #6 at `620d8d8270c6dbde19345a63ca4a932fea877239`,
compared with base commit `c752a208d8a3469bd0889fb11eac0d94ddbc1fdd`.
The reviewed custom structures begin near `app/pages/scenes/index.vue:41` and
`app/components/scenes/SceneCard.vue:418`. Follow
`.agents/playbooks/nuxt-ui.md`, especially rules 1 and 2.

## Dependencies

- None.

## Design

- [PR #6](https://github.com/pagetailoring/crafty-crib-app--smarter-home-development/pull/6)
- Review axis: Standards.

## Resolution

To be completed after delivery.
