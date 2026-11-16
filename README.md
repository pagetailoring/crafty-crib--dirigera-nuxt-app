# Your Home Can Be Smarter. Even with IKEA DIRIGERA

## A Nuxt-based app with Nuxt UI, (...) & a few extra tricks up its sleeve.

🏠 Work in progress

## Roadmap

Coming soon: 42 new features. Don't panic! 🚀

# Nuxt Dirigera app

A single Nuxt application for room and device views, lighting controls, and scene
editing. Device cards display media state; playback and volume controls are not
currently available in the interface.
The Nitro backend talks directly to the IKEA DIRIGERA hub through the TypeScript
[`dirigera`](https://github.com/lpgera/dirigera) package. No separate
`dirigera-web` server is required.

## Requirements

- Node.js matching `engines.node` in `package.json` (currently `^26.11.1`)
  and Bun for dependency installation.
- A DIRIGERA hub reachable from the machine running Nuxt.
- A hub access token, obtained with `bunx dirigera authenticate` after pressing
  the hub's action button when prompted.

## Configuration

Copy `.env.example` to `.env` and set `NUXT_DIRIGERA_ACCESS_TOKEN`. Set
`NUXT_DIRIGERA_GATEWAY_IP` to the hub IP, or leave it empty for local network
discovery. Existing `ACCESS_TOKEN` and `GATEWAY_IP` variables are also accepted
at runtime. The `NUXT_` names take precedence.

The token stays on the server. Do not commit `.env` or put the token in public
runtime configuration. The previous `DIRIGERA_BASE_URL`, `DIRIGERA_PASSWORD`,
and `DIRIGERA_WEBSOCKET_URL` settings are no longer used.

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

## Frontend data paths

- The home view loads room and scene summaries through `app/stores/cache.ts`.
  This Pinia store uses `useDirigera()` and the GraphQL client at
  `app/services/dirigera-client.ts`, with requests sent to
  `/api/dirigera/graphql`. It also provides room-detail and artwork loaders,
  request deduplication, freshness checks, and invalidation. Its query data is
  held in memory, without normalized entities or persistence across reloads.
- The device list and room view load `/api/dirigera/devices` and
  `/api/dirigera/scenes` directly with `useFetch`. The room view also uses cached
  room summaries for its heading. These direct responses are separate from the
  GraphQL-backed Pinia cache.
- Scene list and detail views use `useSceneDetails()` to fetch
  `/api/dirigera/scenes` and `/api/dirigera/scene-products`. Scene edits use
  `PATCH /api/dirigera/scenes/:id`.
- The white-spectrum view loads temperature-capable lights through the GraphQL
  client. Lighting commands also use GraphQL.

Both data paths run inside the same Nuxt server and use server-owned hub
credentials. The frontend does not connect directly to the hub.

## Backend structure

- `server/api/dirigera/graphql.post.ts` serves the GraphQL client contract and
  executes GraphQL locally. It does not proxy another application.
- Other handlers under `server/api/dirigera/` serve the direct device and scene
  endpoints, hub status, and short-lived update tokens.
- `server/services/` contains the GraphQL schema, home/device mappings, commands,
  and the shared hub connection lifecycle.
- `server/routes/dirigera-updates.ts` sends refresh notifications over Nitro's
  WebSocket support, enabled with `nitro.experimental.websocket` in the Nuxt
  configuration.
- `server/plugins/dirigera.ts` closes the hub listener when Nitro shuts down.
- `server/middleware/dirigera-websocket.ts` supplies the current server's absolute
  WebSocket URL to the frontend.

The connection is initialized on demand and shared within the process. The
browser receives a short-lived update token, never the hub access token.
As with the existing Nuxt frontend, there is no user login screen. This version
is intended for a trusted LAN; the update token is not user authentication.

Source attribution for adapted mappings and schema is in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Verification

```sh
bun run test:unit --run
bun run test:nuxt --run
bun run lint
bun run build
```

Backend tests run the existing frontend client's queries and commands against
the local GraphQL executor with a fake hub. They cover device sets, room
aggregates, scenes, quick controls, command routing, connection lifetime, and
update tokens without changing real devices.
