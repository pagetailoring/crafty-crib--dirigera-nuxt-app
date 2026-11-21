# Your Home Can Be Smarter. Even with IKEA DIRIGERA

This app was born out of frustration with the UX of the IKEA app. When the idea came to me, I discovered the [lpgera/dirigera](https://github.com/lpgera/dirigera) library and the [dirigera-web](https://github.com/lpgera/dirigera-web) repository created by @lpgera. The first stage of development involved rewriting the application in @nuxt with the help of Codex, drawing inspiration from @lpgera.

## A Nuxt app with Nuxt UI

🏠 Work in progress

## Features

- Browse rooms and devices, with sensor summaries for each room.
- Control lights: power, brightness, color temperature, hue, and saturation.
- Control outlets and device groups.
- Control lights, outlets, and speakers together within a room.
- Activate scenes saved on the DIRIGERA hub.
- Control music playback, pause, track navigation, and volume, with album artwork.
- View temperature, humidity, air quality, motion, open/closed state, illuminance,
  and battery readings, depending on the device.
- Refresh data automatically after hub notifications and identify unreachable devices.
- Connect directly to DIRIGERA through the backend, without a separate
  `dirigera-web` server.

## PWA status

The app includes a web app manifest and service worker configuration. PWA icons
are not yet configured. Full offline operation is not supported; device controls
require a connection to the Nuxt server and the hub.

## Nuxt Dirigera app

A single Nuxt application for room, device, scene, and media controls.
The Nitro backend talks directly to the IKEA DIRIGERA hub through the TypeScript
[`dirigera`](https://github.com/lpgera/dirigera) package. No separate
`dirigera-web` server is required.

## Requirements

- Node.js matching `^26.11.1`, as declared in `package.json`, and Bun for dependency installation.
- A DIRIGERA hub reachable from the machine running Nuxt.
- A hub access token, obtained with `bunx dirigera authenticate` after pressing
  the hub's action button when prompted.

## Configuration

Copy `.env.example` to `.env` and set `NUXT_DIRIGERA_ACCESS_TOKEN`. Set
`NUXT_DIRIGERA_GATEWAY_IP` to the hub IP, or leave it empty for local network
discovery. Existing `ACCESS_TOKEN` and `GATEWAY_IP` variables are also accepted
at runtime. The `NUXT_` names take precedence.

The token stays on the server. Do not commit `.env` or put the token in public
runtime configuration.

## Development

```sh
bun install
bun run dev
```

Nuxt loads `.env` during development. Open the URL printed by Nuxt. Both HTTP
requests and WebSocket updates use that server, including when opened through
its LAN address.

## Production

```sh
bun run build
node --env-file=.env .output/server/index.mjs
```

If the environment variables are already provided by the host, use
`bun run start`. The build is a Node server, not a static export. It does not
need a reachable hub or a token at build time. `bun run generate` does not
produce a working standalone backend.

Run one long-lived Node process with access to the hub's network. When using a
reverse proxy, forward WebSocket upgrades as well as HTTP and preserve the
request host. TLS termination must provide a trusted HTTPS request scheme to
Nuxt for secure WebSocket URLs.

## Backend structure

- `server/api/dirigera/graphql.post.ts` executes the frontend's GraphQL queries
  and mutations locally. It does not proxy another application.
- `server/services/` contains the GraphQL schema, home/device mappings, commands,
  and the shared hub connection lifecycle.
- `server/routes/dirigera-updates.ts` sends refresh notifications over Nitro's
  WebSocket support. Nitro 2 currently labels this feature experimental.
- `server/plugins/dirigera.ts` closes the hub listener when Nitro shuts down.
- `server/middleware/dirigera-websocket.ts` supplies the current server's absolute
  WebSocket URL to the frontend.

The connection is initialized on demand and shared within the process. The
browser receives a short-lived update token, never the hub access token.
There is no user login screen. This version
is intended for a trusted LAN; the update token is not user authentication.

Source attribution for adapted mappings
and schema is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Verification

```sh
bun run test:unit --run
bun run test:nuxt --run
bun run lint
bun run build
```

Backend tests run the frontend client's queries and commands against
the local GraphQL executor with a fake hub. They cover device sets, room
aggregates, scenes, quick controls, command routing, connection lifetime, and
update tokens without changing real devices.
