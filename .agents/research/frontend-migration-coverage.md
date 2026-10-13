---
createdAt: 2026-10-13
lastReviewed: 2026-10-13
editedAt: 2026-10-13T19:10:36
---

# Frontend migration coverage

## Question and scope

This report compares the application logic in the React reference frontend at
`/Users/pagetailoring/WIP/home/dirigera-web--lpgera/frontend` with the Nuxt
application at `/Users/pagetailoring/WIP/nuxt-with-ui-and-dirigera/app`.

The inspected snapshots were:

- reference repository commit `7f14eace5cd865c6a28f5167665d5fd873898f21`;
- target repository commit `23c9b5e2925d8e46be9ff32423fd1fd52554e40c`.

The target working tree was clean. The reference repository had staged changes
to `.vscode/settings.json`, `bun.lock`, and `package.json`, but no change under
`frontend/`; therefore the compared reference frontend matches the named
commit.

Generated build output and `node_modules` are excluded. Public images and
framework bootstrapping are classified as not applicable when they carry no
application behavior. Storybook is reported separately because it is developer
support rather than production runtime logic.

## Verdict

No, the entire frontend behavior has not been transferred into `app`.

The core smart-home workflow is present: room and scene queries, scene
activation, room quick controls, room navigation, device queries, all six
device mutation families, sensor readings, album artwork, loading/error/empty
states, and event/visibility-triggered refreshes. The target centralizes the
GraphQL operations in one typed client
(`app/services/dirigera-client.ts:77-298`) and renders them through the home and
room pages (`app/pages/index.vue:4-149`, `app/pages/room/[id].vue:8-88`).

The material omissions are the reference authentication UI and client-side
token lifecycle, persisted Apollo cache, PWA installation and offline caching,
automatic WebSocket reconnect, centralized GraphQL error handling including
logout on authentication failure, the unreachable-device `lastSeen` detail,
and Storybook scenarios. There are also behavior changes in color-state
synchronization, in-flight disabling for several controls, playback toggling
outside the paused/playing states, routing, and refresh scope.

## Structure-to-structure mapping

Status meanings:

- **Transferred**: the same user-observable behavior is represented in the
  target, even if the framework syntax differs.
- **Changed**: the responsibility exists, but its architecture or behavior is
  observably different.
- **Missing**: the reference responsibility has no counterpart inside the
  scoped target `app` tree.
- **Not applicable**: framework-generated or non-behavioral structure does not
  require a direct port.

| Reference structure | Target structure | Status | Function and coverage |
| --- | --- | --- | --- |
| `src/index.tsx` | Nuxt bootstrapping; no file under `app` | Not applicable | React root lookup, strict-mode wrapper, and render are framework bootstrapping (`frontend/src/index.tsx:1-15`). Nuxt owns the equivalent entrypoint. |
| `src/components/App.tsx` | `app/app.vue` plus file-based pages | Changed | Both compose the global shell and routes. React explicitly creates hash routes and nests providers (`frontend/src/components/App.tsx:12-44`); Nuxt renders `NuxtPage` and starts global updates (`app/app.vue:1-16`). Hash routing, auth, Apollo, and the explicit dark-theme provider are not preserved here. |
| `src/components/Frame.tsx` | `app/app.vue` | Changed | The shared title/header and page outlet were transferred (`frontend/src/components/Frame.tsx:9-59`; `app/app.vue:5-16`). The home icon, logout action, and token-based `Login`/`Outlet` gate were not transferred. |
| `src/components/AuthContext.tsx` | None in `app` | Missing | The reference reads, stores, and clears `dirigera-web-token` in `localStorage` through login/logout actions (`frontend/src/components/AuthContext.tsx:3-60`). No target `app` module owns client authentication state. |
| `src/components/Login.tsx` | None in `app` | Missing | Password submission through the `login` mutation, token dispatch, the unauthenticated screen, and the commit-SHA update link are absent (`frontend/src/components/Login.tsx:9-85`). |
| `src/components/Logout.tsx` | None in `app` | Missing | The authenticated-only logout action that clears the token is absent (`frontend/src/components/Logout.tsx:6-31`). |
| `src/components/ApolloProvider.tsx` | `app/composables/useDirigera.ts`, `app/services/graphql-request.ts`, `app/services/dirigera-client.ts` | Changed | GraphQL transport and operations were replaced by `$fetch` plus a centralized client (`app/composables/useDirigera.ts:1-6`; `app/services/graphql-request.ts:14-34`; `app/services/dirigera-client.ts:77-298`). Apollo normalized caching, local-storage cache persistence, `x-token`, same-origin credential configuration, centralized error logging, and automatic logout on the reference authentication error are absent (`frontend/src/components/ApolloProvider.tsx:14-52`). |
| `src/components/WebSocketUpdateProvider.tsx` | `app/composables/useDirigeraUpdates.ts`, `app/services/update-subscription.ts` | Changed | Both authenticate a WebSocket and expose messages as refresh triggers. The target obtains a session token from `/api/dirigera/session`, uses a configured URL, and owns cleanup (`app/composables/useDirigeraUpdates.ts:3-28`; `app/services/update-subscription.ts:14-36`). The reference reconnects automatically and only connects when a client token exists (`frontend/src/components/WebSocketUpdateProvider.tsx:12-40`); neither behavior exists in the raw target socket. |
| `src/useRefetch.ts` | `app/app.vue`, `app/services/update-subscription.ts` | Changed | Message and visibility refresh were transferred (`frontend/src/useRefetch.ts:4-20`; `app/app.vue:1-3`; `app/services/update-subscription.ts:25-35`). The reference refetches each mounted query and logs rejected refetches; the target calls global `refreshNuxtData()` and does not handle its rejected promise. |
| `src/components/Scenes.tsx` | `app/pages/index.vue`, scene methods in `app/services/dirigera-client.ts` | Transferred | Scene listing, loading feedback, and activation are present (`frontend/src/components/Scenes.tsx:13-63`; `app/pages/index.vue:4-23,56-68`; `app/services/dirigera-client.ts:96-109,227-233`). The target additionally shows per-scene pending state. |
| `src/components/Rooms.tsx` | `app/pages/index.vue`, room/quick-control methods in `app/services/dirigera-client.ts` | Transferred | Room summaries, five environmental readings, empty quick-control text, room navigation, the three quick-control types, inverse/null mutation semantics, loading feedback, and the query error/skeleton states are present (`frontend/src/components/Rooms.tsx:30-208`; `app/pages/index.vue:4-12,25-50,70-147`; `app/services/dirigera-client.ts:77-94,147-155,223-244`). The target explicitly refreshes home data after a quick-control mutation. |
| `src/components/Room.tsx` | `app/pages/room/[id].vue`, room method in `app/services/dirigera-client.ts` | Transferred | Route-derived room lookup, title, responsive device cards, loading/error states, and the no-device state are present (`frontend/src/components/Room.tsx:19-99`; `app/pages/room/[id].vue:4-15,41-88`; `app/services/dirigera-client.ts:111-145,234-237`). |
| `src/components/Device.tsx` | `app/pages/room/[id].vue` plus `app/components/DeviceControls.vue` | Changed | Device cards, reachability indication, all sensor values, playback metadata, artwork, and supported controls are present (`frontend/src/components/Device.tsx:70-257`; `app/pages/room/[id].vue:17-38,57-86`; `app/components/DeviceControls.vue:102-236`). The reference's unreachable tooltip includes localized `lastSeen`; the target only says `Unreachable`, although it still queries and types `lastSeen` (`app/services/dirigera-client.ts:27-53,111-145`). |
| `src/components/deviceControls/IsOn.tsx` | `DeviceControls.vue` power branch | Transferred | Both disable unreachable devices, send `setIsOn`, and expose pending feedback (`frontend/src/components/deviceControls/IsOn.tsx:30-51`; `app/components/DeviceControls.vue:19-32,104-114`). The target refreshes the room after completion. |
| `src/components/deviceControls/LightLevel.tsx` | `DeviceControls.vue` light-level branch | Changed | The same `1..100` mutation is present (`frontend/src/components/deviceControls/LightLevel.tsx:11-55`; `app/components/DeviceControls.vue:34-41,116-128`). The target commits on the native `change` event and does not disable the control while the mutation is pending; the reference keeps synchronized local state and uses Apollo's loading state. |
| `src/components/deviceControls/LightColor.tsx` | `DeviceControls.vue` temperature/hue/saturation branches | Changed | The same temperature and combined hue/saturation mutations and ranges are present (`frontend/src/components/deviceControls/LightColor.tsx:14-42,95-175`; `app/components/DeviceControls.vue:43-70,130-177`). The reference resynchronizes all local color values whenever props change (`frontend/src/components/deviceControls/LightColor.tsx:59-72`); the target initializes hue/saturation refs only once (`app/components/DeviceControls.vue:8-9`). A later prop refresh can therefore leave the companion value sent by the next hue/saturation mutation stale. Mutation-pending disabling is also absent. |
| `src/components/deviceControls/Playback.tsx` | `DeviceControls.vue` playback branch | Changed | Previous, next, play/pause, availability disabling, buffering feedback, and the mutation are present (`frontend/src/components/deviceControls/Playback.tsx:42-137`; `app/components/DeviceControls.vue:72-90,179-208`). For any state other than `playbackPaused` or `playbackPlaying`, behavior differs: the reference sends `playbackPaused`, while the target sends `playbackPlaying` (`frontend/src/components/deviceControls/Playback.tsx:92-109`; `app/components/DeviceControls.vue:72-80`). |
| `src/components/deviceControls/Volume.tsx` | `DeviceControls.vue` volume branch | Changed | The same `0..50` volume mutation is present (`frontend/src/components/deviceControls/Volume.tsx:11-55`; `app/components/DeviceControls.vue:92-99,210-222`). The target commits on `change` and does not keep or disable for a mutation-pending local state. |
| `src/components/deviceControls/PlayItemImage.tsx` | `DeviceControls.vue` async artwork data | Transferred | Both query `devicePlayItemImageURL`, render only a non-empty result, and refresh it as part of their update strategy (`frontend/src/components/deviceControls/PlayItemImage.tsx:11-35`; `app/components/DeviceControls.vue:11-17,230-235`; `app/services/dirigera-client.ts:215-219,245-250`). |
| `src/components/deviceControls/Battery.tsx` | `app/pages/room/[id].vue` battery reading | Changed | Battery percentage remains visible (`frontend/src/components/deviceControls/Battery.tsx:33-46`; `app/pages/room/[id].vue:19-24`). The eight threshold-based battery icons are not transferred (`frontend/src/components/deviceControls/Battery.tsx:13-31`). |
| `src/graphql.types.ts` and `*.types.gen.ts` | Interfaces and command union in `app/services/dirigera-client.ts` | Changed | Generated GraphQL result/variable/schema types were replaced with manually maintained app-facing types (`app/services/dirigera-client.ts:1-75`). Runtime fields and operation inputs used by the port are represented, but there is no code-generated contract equivalent. |
| `src/components/Device.stories.tsx`, `Frame.stories.tsx`, `.storybook/` | None in `app` | Missing | The reference provides interactive scenarios and mocked GraphQL responses for device variants, authenticated/unauthenticated frame states, rooms, and room devices (`frontend/src/components/Device.stories.tsx:1-178`; `frontend/src/components/Frame.stories.tsx:1-251`; `frontend/.storybook/main.ts:1-12`; `frontend/.storybook/preview.tsx:1-36`). No target-side story/scenario files exist under `app`. This is a tooling/coverage gap, not missing production behavior. |
| `vite.config.ts` PWA configuration and `public/` PWA icons | No counterpart in the target project | Missing | The reference registers an auto-updating service worker, precaches application assets, supplies an installable manifest, and provides regular and maskable icons (`frontend/vite.config.ts:7-52`; `frontend/public/`). The target has a favicon and robots file but no PWA module, manifest, service worker, or equivalent cache policy. |
| `index.html` and React/Vite bootstrapping config | Nuxt-generated application shell | Not applicable | The HTML root and framework-specific build entry do not require a direct source-file port. Nuxt owns their equivalents. |

## Missing or non-equivalent behavior

### 1. Authentication lifecycle is absent from `app`

The reference frontend owns the complete browser token lifecycle: it restores a
token from local storage, writes it after a password login, removes it on
logout, gates routed content behind the token, sends the token in the GraphQL
header, suppresses WebSocket connection without it, and logs out when GraphQL
reports the known authentication failure
(`frontend/src/components/AuthContext.tsx:3-60`;
`frontend/src/components/Login.tsx:9-29`;
`frontend/src/components/Logout.tsx:6-31`;
`frontend/src/components/Frame.tsx:51-57`;
`frontend/src/components/ApolloProvider.tsx:21-46`;
`frontend/src/components/WebSocketUpdateProvider.tsx:23-35`).

The target `app` always renders its page, sends GraphQL requests to a same-origin
Nuxt endpoint without a client token, and separately requests a session token
for the WebSocket (`app/app.vue:5-16`;
`app/services/graphql-request.ts:14-33`;
`app/composables/useDirigeraUpdates.ts:7-24`). This may be an intentional move to
a server-managed session, but within the explicitly compared `app` tree the
login screen, logout action, browser persistence, authentication gate, and
unauthorized-session recovery are missing.

### 2. Apollo cache persistence has no equivalent

The reference creates one normalized `InMemoryCache` and persists it to browser
local storage (`frontend/src/components/ApolloProvider.tsx:14-19,45-46`). The
target uses Nuxt async data per key (`app/pages/index.vue:4-10`;
`app/pages/room/[id].vue:8-15`;
`app/components/DeviceControls.vue:11-17`) but contains no durable client cache
or equivalent normalized entity cache inside `app`.

### 3. Installable PWA and offline asset caching are absent

The reference configures `vite-plugin-pwa` with automatic service-worker
updates, a web app manifest, regular and maskable icons, and Workbox precaching
for its application assets (`frontend/vite.config.ts:7-52`). The target project
has no PWA module, manifest, service worker, or equivalent offline asset cache.
This is missing production behavior even though its source lives in framework
configuration rather than the reference `src` tree.

### 4. WebSocket recovery is weaker

The reference explicitly requests reconnection for every disconnect
(`frontend/src/components/WebSocketUpdateProvider.tsx:29-35`). The target opens
one native WebSocket and registers only `message`; it has no `close` or `error`
recovery path (`app/composables/useDirigeraUpdates.ts:12-24`;
`app/services/update-subscription.ts:25-35`). After a disconnect, automatic
updates remain stopped until the composable is mounted again.

### 5. Color companion values can become stale

The color mutation must send hue and saturation together. The reference keeps
its local companion values synchronized with incoming props before composing
the mutation (`frontend/src/components/deviceControls/LightColor.tsx:59-72,137-174`).
The target copies the initial hue and saturation into refs once and later sends
those refs (`app/components/DeviceControls.vue:8-9,52-69`). If a WebSocket or
another controller updates the device after mount, the displayed prop can
refresh while the companion ref does not, so the next color mutation can
overwrite the newer value.

### 6. Playback toggling differs for idle and buffering states

The reference maps only `playbackPaused` to play and maps every other state to
pause (`frontend/src/components/deviceControls/Playback.tsx:92-109`). The target
maps only `playbackPlaying` to pause and every other state to play
(`app/components/DeviceControls.vue:72-80`). This is an observable semantic
change for values such as `playbackIdle` and `playbackBuffering`.

### 7. Smaller behavior and support gaps

- The reference shows `lastSeen` in the unreachable-device tooltip; the target
  fetches the field but does not render it
  (`frontend/src/components/Device.tsx:71-88`;
  `app/services/dirigera-client.ts:111-145`;
  `app/pages/room/[id].vue:59-65`).
- The reference disables light-level, color, and volume sliders while their
  mutations are pending; the target only checks reachability for those inputs
  (`frontend/src/components/deviceControls/LightLevel.tsx:33-44`;
  `frontend/src/components/deviceControls/LightColor.tsx:74-85,98-100,126-128,153-155`;
  `frontend/src/components/deviceControls/Volume.tsx:33-44`;
  `app/components/DeviceControls.vue:116-177,210-222`).
- The reference centrally logs GraphQL errors and reacts to the known auth
  error; the target request layer converts GraphQL errors into thrown `Error`
  values but has no central logging or auth reaction
  (`frontend/src/components/ApolloProvider.tsx:23-36`;
  `app/services/graphql-request.ts:24-30`).
- The reference loads scenes and rooms through independent queries, so a scene
  query failure does not prevent room data from rendering. The target combines
  both calls in one `Promise.all`, so either failure rejects the complete home
  payload (`frontend/src/components/Scenes.tsx:23-25`;
  `frontend/src/components/Rooms.tsx:66-68`; `app/pages/index.vue:4-12`).
- The reference tracks pending quick controls by ID and can represent multiple
  concurrent mutations. The target stores only one active ID; starting another
  quick-control mutation replaces the first loading indicator, and either
  completion clears the shared state (`frontend/src/components/Rooms.tsx:68-70,148-169`;
  `app/pages/index.vue:25-50`).
- The reference battery icon thresholds and commit-SHA update link are absent
  (`frontend/src/components/deviceControls/Battery.tsx:13-31`;
  `frontend/src/components/Login.tsx:72-82`).
- Reference Storybook scenarios and mocked GraphQL examples have no target
  counterpart under `app` (`frontend/src/components/Device.stories.tsx:1-178`;
  `frontend/src/components/Frame.stories.tsx:1-251`).

## Bottom line

The migration covers the principal device-control and read-only monitoring
features, but it is not behaviorally complete. Before calling the frontend fully
ported, decide whether browser-managed authentication, Apollo persistence, and
PWA/offline support were intentionally retired. Independently of those
architectural decisions, the target still needs WebSocket reconnect,
color-state resynchronization, an explicit playback-state decision, and—if
parity is required—the `lastSeen`, pending-control, centralized error, and
Storybook behaviors listed above.
