---
createdAt: 2026-11-18
editedAt: 2026-11-18T00:12:40
lastReviewed: 2026-11-18
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
priority: P3
reviewAxis: standards
---

# Disambiguate app Device and Scene types

## Description

Possible Mysterious Name: `app/types/dirigera-client.d.ts` exports `Device`
and `Scene`, which share their names with the `dirigera` package types. The two
models differ: the package types describe raw hub data (`attributes`,
`capabilities`), while the app types describe the flattened GraphQL response
(`isOn`, `lightLevel`, `type: ControlType`). Only the import path tells them
apart, so readers must check imports to know which model a `device` holds, and
an editor-suggested import can pick the wrong one. This is a design
observation, not a documented-standard violation. The naming predates PR #7,
which only moved the types from `app/services/` to `app/types/`.

## Goal

Make the app's GraphQL-backed `Device` and `Scene` types distinguishable from the `dirigera` package types by name.

## Scope

- Rename the app-owned `Device` and `Scene` types to names that state their
  model, for example `CachedDevice` and `CachedScene` or `GraphqlDevice` and
  `GraphqlScene`.
- Update every consumer of `~/types/dirigera-client` that uses these types.

## Out of scope

- Unrelated refactors and other PR review findings.
- Changes to the `dirigera` package types or the GraphQL schema.
- Changes to runtime behavior.

## Acceptance criteria

- [ ] No app-owned type shares a name with a `dirigera` package type it can be confused with.
- [ ] All consumers compile against the renamed types and typecheck passes.
- [ ] Existing tests pass without behavior changes.

## Open questions

- Which naming convention to use: `Cached*`, `Graphql*`, or another prefix.

## Technical notes

At commit `8ec9ab1`, the app types are declared at
`app/types/dirigera-client.d.ts:26` (`Scene`) and `:36` (`Device`). Consumers of
`~/types/dirigera-client` are `app/stores/cache.ts`, `app/utils/dirigera-client.ts`,
`app/pages/white-spectrum.vue`, `tests/nuxt/rooms-menu.test.ts`, and
`tests/nuxt/dirigera-cache.test.ts`. Most other files import `Device` and
`Scene` from `dirigera` and are unaffected.

## Dependencies

- None.

## Design

- [PR #7](https://github.com/pagetailoring/smarter-home-even-with-dirigera--nuxt-app/pull/7),
  code review point 10.
- Review axis: standards (Fowler smell baseline).

## Resolution

To be completed after delivery.
