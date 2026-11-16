---
createdAt: 2026-11-16
editedAt: 2026-11-16T14:50:18
lastReviewed: 2026-11-16
status: closed
type: task
assignee: codex
claimedAt: 2026-11-16T14:49:56
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

- [x] The relevant Nuxt UI component APIs and existing project adapters are
      checked before implementation.
- [x] The reviewed header, action group, grid, and card layout use Nuxt UI
      components where those components can preserve the current behavior.
- [x] Every remaining custom markup or styling exception has an explicit,
      recorded justification approved by the user.
- [x] Focused scene component tests and the repository validation checks pass.
- [x] Any manual visual verification performed is reported separately from
      automated validation.

## Open questions

- Resolved by the appearance-preserving exceptions recorded below.

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

The user explicitly requested preserving the current appearance on 2026-11-16.

Reviewed PageHeader, PageGrid, FieldGroup, and PageCard APIs and the installed
Nuxt UI themes. The only project adapter is UiSwitch, which remains in use.
Replaced the scene grid wrapper with UPageGrid. Local classes preserve static
positioning, gap-5, one column below xl, and two columns from xl.

Approved appearance-preserving exceptions:

- Retain the page header markup and its spacing. PageHeader introduces a border,
  larger description text, different padding, and different responsive placement.
- Retain separate, wrapping action buttons in the header and card. FieldGroup
  joins button edges and changes spacing and wrapping.
- Retain SceneCard header, product and trigger rows, badge groups, editor panels,
  schedule buttons, and footer layouts with their existing classes and UCard
  padding overrides. PageCard and default card layouts do not reproduce these
  grouped rows, tinted panels, compact spacing, and responsive arrangements.
- Retain alert margins and existing typography to avoid changing vertical rhythm.

These exceptions are scoped to the two reviewed files and follow the user's
instruction to preserve their appearance. Scene behavior is unchanged.

Validation: `bun run check` passed, including 122 tests across 18 files,
scene component tests, ESLint, Prettier, Nuxt typecheck, and vue-tsc.
`git diff --check` passed. No manual browser verification was performed; visual
equivalence is based on preserving the existing layout classes, not screenshots.
