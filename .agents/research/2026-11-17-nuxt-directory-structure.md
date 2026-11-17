---
createdAt: 2026-11-17
editedAt: 2026-11-17T02:27:34
lastReviewed: 2026-11-17
---

# Nuxt directory structure assessment

Analysis of checkout `82bbcdb`, declaring Nuxt `^4.6.1`. The working tree was clean before this report. No application files were changed. All moves below are proposals awaiting user agreement. The user accepts root `config/` and wants other custom directory choices discussed before adoption.

## Findings

The root separation into `app/`, `server/`, `shared/`, and `public/` follows Nuxt 4. `nuxt.config.ts` does not override the source directory. Root `tsconfig.json` references Nuxt's app, server, shared, and node configurations. Neither extra layers nor empty standard directories are needed.

### Replace the two services directories

Nuxt provides `app/utils/` for helpers and `app/composables/` for Vue composables. Current application services use ordinary functions and injected dependencies, without Vue lifecycle or Nuxt context calls. Their composable wrappers already occupy `app/composables/`.

Propose moving these files into the existing `app/utils/` directory, keeping filenames and module boundaries:

- `app/services/device-associations.ts`
- `app/services/normalize-sensors.ts`
- `app/services/graphql-request.ts`
- `app/services/dirigera-client.ts`
- `app/services/update-subscription.ts`

`useDirigeraUpdates.ts` should keep lifecycle handling in the composable; its subscription helper can remain an independently testable function. Moving all helpers into composables or merging them into wrappers is unnecessary.

Propose moving these files into the existing `server/utils/` directory:

- `server/services/dirigera-api.ts`
- `server/services/dirigera-connection.ts`
- `server/services/dirigera-home.ts`
- `server/services/dirigera-scenes.ts`
- `server/services/dirigera-schema.ts`

These provide API execution, connection management, mapping, scene operations, and schema construction. Keep route handlers in `server/api/` and `server/routes/`, and cleanup registration in `server/plugins/`. The current separation of handlers from implementation is useful even without a services directory.

The custom directory names are not demonstrated runtime errors. Their replacement is a recommendation matching the user's preference for standard directories. Moving exports into utils also makes them eligible for auto-import scanning; review export names and keep explicit imports where needed, especially in standalone unit tests.

### Keep shared types

`shared/types/` is an official Nuxt directory. Both current files have app and server consumers:

- `dirigera-status.ts`: `app/stores/state.ts` and `server/services/dirigera-connection.ts`.
- `scene-editor.ts`: app composables/components/pages and `server/services/dirigera-scenes.ts`.

They contain types, with a type-only dependency on the Dirigera package, and no Vue or Nitro runtime imports. Their placement matches their actual use. Prefer `#shared/types/...` over deep relative imports in Nuxt-managed code. Standalone tests need aliases configured if they start importing alias-dependent modules.

### Keep stores under the Pinia convention

`@pinia/nuxt` is enabled in `nuxt.config.ts`. The installed module defaults its store directory to `srcDir/stores`, which is `app/stores` here. Generated `.nuxt/imports.d.ts` also lists all three stores. This is a module convention, not a project-specific services layer. Moving stores into composables or replacing Pinia is not necessary for directory alignment.

### Retain config, discuss its executable helpers separately

The user accepts `config/`. Keep constants such as `APP_NAME`, cache duration, throttling values, weekdays, and lookup tables there.

Some files also contain functions:

- `config/color-temperature.ts` contains range calculation and clamping. App code and server mapping use it. Propose moving this module to `shared/utils/color-temperature.ts`.
- `config/scene-controls.ts` combines constants and labels with `sceneNumericControl`, used by app and server code. A possible follow-up is extracting the function into `shared/utils/scene-controls.ts`, retaining configuration data in `config/`.
- `config/ikea-icons.ts` and `config/ikea-room-colors.ts` mix lookup tables with frontend lookup functions. Optional extraction into `app/utils/` would clarify the distinction; it also increases the number of files, so this should be decided with the user.

These are content-placement suggestions, not grounds to remove the accepted config directory. Do not move config wholesale into `app/app.config.ts`: some values are used by server code or Nuxt build configuration.

### Remaining directories

- `app/pages/`, `app/components/`, `app/assets/`, and `app/composables/` have the expected roles. Component subdirectories group components; they do not require new framework conventions.
- `app/app.vue` hosts the common shell and `NuxtPage`. A `layouts/default.vue` file is optional and not needed solely to match a directory diagram.
- `server/api/`, `server/routes/`, `server/middleware/`, `server/plugins/`, and `server/utils/` hold their expected kinds of modules. This is a placement assessment, not verification of runtime correctness.
- `public/` contains `favicon.ico` and `robots.txt`, appropriate for files served without asset processing.
- `tests/unit/` and `tests/nuxt/` match explicit patterns in `vitest.config.ts`. Nuxt documents `test/`, but the runner controls discovery. Propose retaining `tests/` as a tooling convention; if literal directory-name alignment is desired, discuss renaming it to `test/` and updating those patterns.
- `tools/verify-pwa-build.mjs` is invoked by the `verify:pwa` package script. It is a custom repository tooling directory, not a Nuxt runtime directory. Propose retaining it for build verification; moving it into app/server utils would put it in the wrong context. Its retention remains a user decision.
- `.agents/` contains project agent documentation and is outside Nuxt application structure.

## Suggested scope for a later change

First agree on the ten service-file moves, retention of `tests/` and `tools/`, and whether to include the color-temperature module. Keep the remaining config-function extractions separate unless requested. Update importing application files and existing tests, preserve technical comments, and check auto-import collisions. Run the existing checks after implementation. No tests or build were run for this read-only source assessment.

## Primary sources

- [Nuxt directory structure](https://nuxt.com/docs/4.x/directory-structure)
- [Application utils](https://nuxt.com/docs/4.x/directory-structure/app/utils)
- [Application composables](https://nuxt.com/docs/4.x/directory-structure/app/composables)
- [Server directories and utilities](https://nuxt.com/docs/4.x/directory-structure/server)
- [Shared code, types, and the shared alias](https://nuxt.com/docs/4.x/directory-structure/shared)
- [Tests](https://nuxt.com/docs/4.x/directory-structure/test)
- [Pinia Nuxt integration](https://pinia.vuejs.org/ssr/nuxt.html)

Local evidence includes `package.json`, `nuxt.config.ts`, `tsconfig.json`, `vitest.config.ts`, the source files named above, import searches across app/server/config/tests, and `node_modules/@pinia/nuxt/dist/module.mjs`. Generated `.nuxt` files provide supporting evidence only and were not regenerated during this assessment.
