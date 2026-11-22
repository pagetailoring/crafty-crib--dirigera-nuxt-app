---
createdAt: 2026-10-13
editedAt: 2026-11-15T13:23:47
lastReviewed: 2026-11-15
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
triage: ready-for-agent
---

# Address integrated backend migration regressions

**Status:** ready-for-agent

## Current status

This task is partially implemented at target commit `4005c9f`. The application
now exposes `/api/dirigera/status`, probes the hub before reporting `ready`, and
keeps failed connection initialization retryable. Those changes cover the
readiness and recovery part of the task.

The remaining work is still open. Root resolver failures are converted to one
safe message, but the original cause is discarded and no structured operation
category is reported. Resolver types are still handwritten, no reproducible
schema-derived generation command exists, and the trusted-LAN access model is
unchanged.

## Problem Statement

The integrated Nuxt server preserves the current frontend's Dirigera domain
behavior, but the migration also removed or changed several backend guarantees.
Resolver failures lose their original cause, schema and resolver types can
drift without a compile-time failure, and the process can report itself as
running before the hub connection is usable. The password and JWT boundary of
the reference backend was also removed. That access-control change is accepted
only while the application is explicitly operated as a single-process tool on
a trusted local network.

The user needs the single-server Nuxt application to remain diagnosable and
safe to evolve without reintroducing Express, Apollo, a separate backend
process, or frontend work in this phase.

## Solution

Keep Nitro as the sole server and preserve the current GraphQL and WebSocket
contracts. Add structured server-side reporting that retains the original
Dirigera failure without exposing secrets to the browser. Restore
schema-derived type checking at the GraphQL resolver boundary. Expose a
readiness signal that distinguishes a live Nuxt process from a usable Dirigera
connection.

Keep the current trusted-LAN access model for this phase and document it as an
explicit deployment constraint. Do not describe the short-lived WebSocket
token as user authentication. A future deployment outside that boundary must
add real application authentication before it is considered supported.

## User Stories

1. As the application operator, I want one Nuxt process to own the frontend,
   GraphQL API, WebSocket updates, and hub connection, so that I do not have to
   start or supervise a separate backend.
2. As an existing frontend user, I want room, scene, device, device-set, quick
   control, artwork, and update behavior to remain unchanged, so that backend
   hardening does not alter current functionality.
3. As an application operator, I want the server to preserve the original hub
   failure in its logs, so that I can distinguish an unavailable hub from an
   expired token, invalid device identifier, timeout, or programming defect.
4. As an application user, I want server failures to return safe and stable
   GraphQL errors, so that private hub details and credentials are not exposed
   in the browser.
5. As an application operator, I want every logged failure to identify the
   failed operation and error category, so that I can diagnose the problem
   without reproducing it under a debugger.
6. As an application operator, I want secrets and authorization headers to be
   excluded from logs, so that diagnostics do not create a credential leak.
7. As a developer, I want resolver argument and return types to be derived from
   the GraphQL schema, so that schema drift fails type checking before runtime.
8. As a developer, I want generated or derived GraphQL artifacts to be
   reproducible through a project command, so that local development and CI use
   the same contract.
9. As a reviewer, I want CI to detect stale schema-derived artifacts, so that a
   passing build proves the schema and implementation still agree.
10. As an application operator, I want a readiness result that reports whether
    required hub configuration is present and the shared connection is usable,
    so that process liveness is not mistaken for application readiness.
11. As an application operator, I want a failed lazy initialization to remain
    retryable, so that a temporary hub outage does not require restarting Nuxt.
12. As an application operator, I want readiness to recover after a successful
    retry, so that monitoring reflects the current connection state.
13. As a trusted-LAN user, I want GraphQL and update delivery to continue
    without a new login screen in this phase, so that the backend work does not
    expand into frontend authentication.
14. As a security reviewer, I want the trusted-LAN limitation stated plainly,
    so that same-origin checks and update tokens are not mistaken for user
    authentication.
15. As a future deployer, I want deployments outside a trusted LAN identified
    as unsupported until real authentication is added, so that the control API
    is not exposed under a false security assumption.
16. As a maintainer, I want Nitro to continue owning HTTP, WebSocket, and
    shutdown behavior, so that hardening does not recreate the reference
    Express architecture inside Nuxt.

## Implementation Decisions

- Nitro remains the only application server. Do not add Express, Apollo, a
  second listener, or a separately started backend.
- Preserve the current GraphQL operations, field names, nullability, device
  versus device-set dispatch, and WebSocket `update` message contract.
- Preserve one shared Dirigera client and one hub update listener per process.
  Failed lazy initialization remains retryable.
- Replace blanket error swallowing with a server-side error boundary that logs
  the original error together with the GraphQL operation and a stable category.
  Logs must omit the hub access token, request authorization data, application
  secrets, and complete sensitive payloads.
- Return a stable, non-sensitive GraphQL error to the client. Expected hub
  availability failures must be distinguishable from invalid requests and
  unexpected internal failures through safe error metadata; raw library
  messages and stack traces must stay server-side.
- Derive resolver argument and result types from the GraphQL schema. The chosen
  generation or typed-schema mechanism must make a schema/resolver mismatch a
  TypeScript failure and must be reproducible by a documented project command.
- CI or the existing validation command must detect stale generated artifacts
  when generation is used.
- Add a read-only readiness contract that distinguishes process liveness from
  Dirigera readiness. It must report not ready when required configuration is
  absent or the current connection attempt has failed, and ready after a
  successful connection or retry. It must not reveal credentials, gateway
  details, stack traces, or device data.
- Keep the current trusted-LAN access model for this phase. The GraphQL endpoint
  remains without interactive user authentication because frontend changes are
  outside scope.
- Treat the WebSocket token as a short-lived upgrade token only. Documentation
  and naming must not present it as an authenticated user session.
- Explicitly document that direct network access to the Nuxt server implies
  access to device-control mutations. Deployments outside a trusted LAN are
  unsupported until application authentication protects both GraphQL and
  update-token issuance.
- Retain the artwork timeout and HTTP response validation introduced during the
  Nuxt migration.
- Do not change static caching or response compression without measurement.
  Their absence from the source mapping is not enough to prove a runtime
  regression under Nitro.

## Testing Decisions

- Prefer the highest existing seam: exercise the public Nitro GraphQL endpoint
  with a fake Dirigera client and assert observable HTTP and GraphQL behavior.
- Exercise the public readiness endpoint or handler with absent configuration,
  a failed connection, a successful connection, and recovery after retry.
- Exercise the WebSocket upgrade path only for retained update-token behavior;
  do not treat possession of that token as proof of user authentication.
- Verify that an expected hub outage returns stable safe metadata to the client
  while the server logger receives the original cause and operation context.
- Verify that an unexpected resolver defect is categorized separately from a
  hub availability failure and is retained in server diagnostics.
- Include a secret-shaped fixture and assert that tokens, authorization values,
  and configured secrets do not appear in captured logs or GraphQL responses.
- Add a contract check proving that a deliberate schema/resolver mismatch fails
  generation or type checking. Avoid tests that merely reproduce implementation
  branches already covered by TypeScript.
- Preserve the existing backend contract tests for rooms, environmental
  averages, device sets, scenes, quick controls, all current commands, shared
  connection lifetime, update broadcasts, and update-token expiry.
- Do not use a real hub for mutation tests. A read-only live-hub smoke check may
  remain a manual verification step, separate from automated tests.

## Out of Scope

- Frontend refactoring or a login user interface.
- Restoring the reference password and JWT implementation unchanged.
- Reintroducing Apollo, Express, or the separate `dirigera-web` process.
- Supporting public internet exposure before a separate authentication design
  is approved.
- Multi-instance deployment, shared WebSocket-token secrets, sticky sessions,
  or distributed hub-connection ownership.
- Changing device, room, scene, quick-control, artwork, or WebSocket product
  behavior.
- Performance changes for compression or static-asset caching without measured
  evidence from the production Nitro server.

## Further Notes

The migration assessment classified the gaps as follows:

| Change                                                         | Assessment                                                                                                  | Reason                                                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Removed password login and GraphQL JWT authorization           | Security regression relative to the reference backend; accepted only within the stated trusted-LAN boundary | Same-origin validation is not authentication, and non-browser clients can omit `Origin`.         |
| Unauthenticated update-token issuance                          | Security regression relative to the reference backend; accepted only within the stated trusted-LAN boundary | The token proves only that a caller reached the endpoint, not user identity.                     |
| Generic resolver error with no retained cause                  | Operational regression to fix                                                                               | Hub outages, expired credentials, invalid identifiers, and defects become indistinguishable.     |
| Removed schema-derived resolver types                          | Maintainability regression to fix                                                                           | Schema and resolver implementation can drift without a TypeScript failure.                       |
| Lazy hub connection                                            | Trade-off to retain with readiness                                                                          | It permits retry without restart but allows a live process whose main dependency is unavailable. |
| Process-local update-token secret                              | Acceptable for the supported single-process deployment                                                      | It becomes a regression only with multiple instances, which are out of scope.                    |
| Replacing Apollo and Express with GraphQL and Nitro primitives | Correct architectural change                                                                                | Current domain operations are retained without a second server.                                  |
| Artwork timeout and response validation                        | Improvement to retain                                                                                       | It prevents indefinite requests and rejects failed artwork responses.                            |
| No explicit compression or 30-day static cache rule            | Unproven performance gap                                                                                    | Runtime behavior must be measured before treating this as a regression.                          |

The source comparison is recorded in
[Dirigera backend migration coverage](../../../research/prototype-development/backend-migration-coverage.md).

## Dependencies

- None. This task can start immediately.

## Design

- [Dirigera backend migration coverage](../../../research/prototype-development/backend-migration-coverage.md)

## Resolution

To be completed after delivery.
