---
createdAt: 2026-10-13
editedAt: 2026-10-13T23:22:11
lastReviewed: 2026-10-13
status: open
type: task
assignee: null
claimedAt: null
blockedBy: []
---

# Add the final PWA icons

## Description

The temporary PWA graphics were intentionally removed. The application needs
final regular and maskable icons before its web app manifest can provide a
complete installed experience.

## Goal

Add the approved Smarter Home PWA icon assets and declare them in the generated
web app manifest.

## Scope

- Add the final regular and maskable PWA icon files supplied or approved for
  Smarter Home.
- Enable matching icon declarations in the Nuxt PWA manifest configuration.
- Extend the production PWA verification to check the declarations and emitted
  files.
- Perform a focused installation smoke test in a supporting browser.

## Out of scope

- Designing or generating the final icon artwork without a separate request.
- Adding a custom installation prompt or update interface.
- Changing service-worker caching for GraphQL, WebSocket, or other live data.

## Acceptance criteria

- [ ] The repository contains approved regular and maskable PWA icons in the
      declared sizes and formats.
- [ ] Every manifest icon declaration points to an emitted file and has the
      correct size, media type, and purpose.
- [ ] The production PWA verification checks the icon declarations and files.
- [ ] The PWA production build and verification pass.
- [ ] A supporting browser recognizes the production application as
      installable with the final Smarter Home icons.

## Open questions

- Which final artwork and source files should be used?
- Which icon sizes and formats should the approved asset set provide?

## Technical notes

The icon declarations in `nuxt.config.ts` remain commented out until the final
assets are available. Do not restore the removed temporary graphics.

## Dependencies

- Final icon artwork supplied or approved by the user.

## Design

- [Frontend migration parity task](../frontend-migration-parity/tasks/01-complete-frontend-migration-parity.md)

## Resolution

To be completed after delivery.
