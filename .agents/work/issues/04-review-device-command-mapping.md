---
createdAt: 2026-11-15
editedAt: 2026-11-16T14:42:46
lastReviewed: 2026-11-16
status: closed
type: task
assignee: codex
claimedAt: 2026-11-16T14:40:55
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

- [x] Each command has an explicit transport and cache policy.
- [x] An unhandled variant cannot silently bypass the cache update policy.
- [x] Existing command and cache behavior remains covered by focused checks.

## Open questions

- Resolved below. Exhaustive handling is sufficient for the current commands.

## Technical notes

At target commit `4005c9f`, the repeated mapping remains in
`app/services/dirigera-client.ts:282-339` and `app/stores/cache.ts:139-166`.
Neither branch is exhaustive at compile time. Avoid a broad command framework
solely to remove repetition.

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

Completed on 2026-11-16.

Kept the transport and cache mappings separate and added exhaustive `never`
checks to both. Shared field metadata is unnecessary for six explicit commands
with different transport and cache responsibilities. The transport now handles
`setIsOn` explicitly instead of using it as a fallback. Every cache branch
returns after applying its fields, so adding a command without a cache policy
fails type checking.

The existing policies are preserved: power, brightness, color temperature,
playback, and volume update their corresponding fields; color updates both hue
and saturation. The client sends the existing GraphQL mutations and payloads.
After successful commands, the cache updates matching devices and reloads the
affected rooms. Failed commands leave cached data unchanged.

Expanded the cache tests to cover all six commands, unchanged state while a
command is pending, gateway state replacing the local patch, and command
failure. Existing client tests cover all six mutation payloads.

Validation:

- Focused client and cache tests passed: 22 tests in two files.
- `bun run check` passed: 122 tests in 18 files, ESLint, Prettier, Nuxt typecheck,
  and vue-tsc.
- An in-memory TypeScript compiler check added a fictional command and confirmed
  missing-handler errors in both mappings without modifying source files.
- No browser or physical-device verification was performed.

The in-flight cache invalidation issue remains separate and unchanged.
