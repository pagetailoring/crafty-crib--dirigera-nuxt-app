# Your Home Can Be Smarter. Even with IKEA DIRIGERA

This app was born out of frustration with the UX of the IKEA app. When the idea came to me, I discovered the [lpgera/dirigera](https://github.com/lpgera/dirigera) library and the [dirigera-web](https://github.com/lpgera/dirigera-web) repository created by @lpgera. The first stage of development involved rewriting the application in [Nuxt](https://github.com/nuxt/nuxt) with the help of Codex, drawing inspiration from [@lpgera](https://github.com/lpgera).

## A Nuxt app with Nuxt UI

🏠 Work in progress

## Roadmap

Coming soon: 42 new features. Don't panic! 🚀

# Nuxt Dirigera app

A single Nuxt application for the existing room, device, scene, and media controls.
The Nitro backend talks directly to the IKEA DIRIGERA hub through the TypeScript
[`dirigera`](https://github.com/lpgera/dirigera) package. No separate
`dirigera-web` server is required.

## Requirements

- Node.js 22 or newer and Bun for dependency installation.
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

## Backend structure

- `server/api/dirigera/graphql.post.ts` keeps the existing frontend contract and
  executes GraphQL locally. It does not proxy another application.
- `server/services/` contains the GraphQL schema, home/device mappings, commands,
  and the shared hub connection lifecycle.
- `server/routes/dirigera-updates.ts` sends refresh notifications over Nitro's
  WebSocket support. Nitro 2 currently labels this feature experimental.
- `server/plugins/dirigera.ts` closes the hub listener when Nitro shuts down.
- `server/middleware/dirigera-websocket.ts` supplies the current server's absolute
  WebSocket URL to the unchanged frontend.

The connection is initialized on demand and shared within the process. The
browser receives a short-lived update token, never the hub access token.
As with the existing Nuxt frontend, there is no user login screen. This version
is intended for a trusted LAN; the update token is not user authentication.

The frontend files and functionality are unchanged. New features and a frontend
refactor are outside this migration. Source attribution for adapted mappings
and schema is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

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
