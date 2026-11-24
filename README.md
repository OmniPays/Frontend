# OmniPays Frontend

OmniPays Frontend is the Next.js 14 (Pages Router) web UI for a Stellar/Soroban decentralized exchange. It provides swap and liquidity flows across Soroban AMMs and Stellar classic paths, with Freighter wallet integration, an optional routing API, and test-token minting for non-production networks.

This repository was previously maintained as `soroswap/frontend`; the current source of truth is `OmniPays/Frontend`.

## Architecture

- `pages/` — Next.js Pages Router entry points. UI pages live here, and `pages/api/` holds server-only API routes that proxy backend calls and sign test-token mints.
- `src/components/` — Reusable UI (swap, liquidity, modals, wallet, settings) built with `soroswap-ui`/MUI.
- `src/hooks/` and `src/state/` — React hooks, SWR data fetching, and Redux Toolkit state (`mint`, `user`, `burn` slices).
- `src/functions/`, `src/helpers/`, `src/services/` — Pure pricing/route helpers, Stellar XDR/address helpers, and API clients.
- `src/soroban/` — `stellar-react` provider and network configuration, including the active network passed to hooks.
- `cypress/` — Cypress end-to-end and component tests; unit tests for pure helpers run with Vitest.

Requests to the external routing backend go through `pages/api/pairs.ts` and `pages/api/quote/index.ts`, which add the server-side API key and enforce request validation. Minting uses `pages/api/mint/test-token.ts` so the admin secret is never available in browser JavaScript.

## Prerequisites

- Node.js 20.x (the Docker workflow uses `node:20.18.0`) and npm
- Yarn 1.22.22 — this repo pins `packageManager: yarn@1.22.22`; if Yarn is not installed, use `npx -y yarn@1.22.22 <command>`
- Docker >= 24.0.2 for the optional containerized development flow
- [Freighter](https://www.freighter.app/) browser wallet, with experimental mode enabled for local networks
- A funded Stellar account (friendbot for local/test networks)

## Getting started

### 1. Clone

```bash
git clone https://github.com/OmniPays/Frontend.git
cd Frontend
```

### 2. Configure environment variables

For local Next.js development:

```bash
cp .env.local.example .env.local
```

For a production-like build:

```bash
cp .env.production.example .env.production
```

Edit the file for your environment. Key settings:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_DEFAULT_NETWORK` | client | `mainnet`, `testnet`, `standalone`, or `futurenet`; determines the default wallet network. |
| `NEXT_PUBLIC_BACKEND_URL` | client | Backend base URL used for token lists and metadata. |
| `NEXT_PUBLIC_AGGREGATOR_ENABLED_MAINNET` / `NEXT_PUBLIC_AGGREGATOR_ENABLED_TESTNET` | client | Toggle aggregator routing per network. |
| `NEXT_PUBLIC_DIRECT_PATH_ENABLED` | client | Emergency single-hop path routing when set to `true`. |
| `NEXT_PUBLIC_TRUSTLINE_WALLET_PUBLIC_KEY` | client | Public key used to simulate transactions and estimate fees. |
| `NEXT_PUBLIC_MAINNET_RPC_URL` | client | Public mainnet Soroban RPC endpoint. The default is `https://soroban-rpc.mainnet.stellar.org/`. Do not embed provider keys here. |
| `SOROSWAP_API_URL`, `SOROSWAP_API_KEY` | server | Backend routing API base URL and API key; used only by Next API routes. |
| `ALLOWED_ORIGINS` | server | Comma-separated list of exact origins permitted to call the API routes. Same-origin requests and localhost are always allowed. |
| `TEST_TOKENS_ADMIN_SECRET_KEY` | server | Secret key of the test-token admin account. Required only to mint test tokens. Never prefix this with `NEXT_PUBLIC_`. |
| `TESTNET_RPC_URL`, `STANDALONE_RPC_URL`, `FUTURENET_RPC_URL` | server | Optional RPC overrides for the mint route; defaults to public endpoints or the local Stellar Quickstart URL. |

Security note: anything prefixed with `NEXT_PUBLIC_` is inlined into client bundles and is readable by anyone. Never put admin keys, API keys, or private RPC credentials in `NEXT_PUBLIC_*` variables. The mint endpoint reads `TEST_TOKENS_ADMIN_SECRET_KEY` only on the server; leaving it unset disables test-token minting.

### 3. Install and run locally

```bash
npx -y yarn@1.22.22 install
npx -y yarn@1.22.22 dev
```

The app is available at <http://localhost:3000>. To run the production build locally:

```bash
npx -y yarn@1.22.22 build
npx -y yarn@1.22.22 start
```

### 4. Docker development flow

`docker/run.sh` mounts the repository into a `node:20.18.0` container on the `soroswap-network` Docker network and opens a shell in it.

```bash
docker network create soroswap-network  # only if it does not exist yet
bash docker/run.sh
yarn install
yarn dev
```

The container publishes port 3000. The script passes `.env` to the container with `--env-file`; create `.env` from the example first if you use this flow.

### 5. Local networks and Freighter

Freighter configuration for a local Stellar Quickstart node:

| Setting | Standalone | Futurenet |
| --- | --- | --- |
| Name | Local Standalone | Local Futurenet |
| Horizon RPC URL | `http://localhost:8000` | `http://localhost:8000` |
| Soroban RPC URL | `http://localhost:8000/soroban/rpc` | `http://localhost:8000/soroban/rpc` |
| Passphrase | `Standalone Network ; February 2017` | `Test SDF Future Network ; October 2022` |
| Friendbot | `http://localhost:8000/friendbot` | `http://localhost:8000/friendbot` |
| Allow HTTP connection | Enabled | Enabled |

Enable **Preferences → Allow experimental mode** in Freighter, then fund your account with friendbot (for example `http://localhost:8000/friendbot?addr=<your address>`) or via the Stellar Laboratory for Futurenet. Mainnet and public testnet do not require these local settings.

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start the Next.js development server. |
| `yarn build` | Create a production build. |
| `yarn start` | Serve the production build. |
| `yarn lint` | Run Next.js ESLint checks. |
| `yarn test` | Run Cypress end-to-end tests in Chrome (requires a running app). |
| `yarn test:unit` | Run Vitest unit tests for pure helpers. |
| `yarn format` | Format TypeScript/TSX sources with Prettier. |
| `yarn cy:run` | Alias for the Cypress suite. |
| `yarn cy:run:w` | Run only the wallet connection spec. |

## Testing

End-to-end tests use **Cypress** (not Vitest). Start the app first, then run:

```bash
yarn dev
yarn test
```

`cypress/e2e/` contains wallet, swap, and navigation flows; `cypress/component/` contains component tests. Cypress retries are configurable with `CYPRESS_RETRIES` and wait for UI conditions rather than fixed sleeps where possible.

Pure helper logic is covered by Vitest:

```bash
yarn test:unit
```

## Deployment

1. Build with `yarn build` and serve with `yarn start` (or deploy to a Next.js-compatible host).
2. Set all server-only variables in the hosting environment: `SOROSWAP_API_URL`, `SOROSWAP_API_KEY`, `TEST_TOKENS_ADMIN_SECRET_KEY` (if minting is needed), RPC overrides, and `ALLOWED_ORIGINS`.
3. Set `NEXT_PUBLIC_*` values at build time; they are compiled into client bundles.
4. Restrict `ALLOWED_ORIGINS` to the exact origins of your deployed frontend. Requests without a recognized `Origin`/`Referer` are rejected by the API routes.
5. Do not expose provider credentials through `NEXT_PUBLIC_MAINNET_RPC_URL`; use a public endpoint or move RPC access behind your own server proxy.

## Contributing

Issues and pull requests are welcome. Keep Next.js Pages Router conventions, add tests for pure helpers where practical, and never commit real credentials.

## License

MIT — see [LICENSE](LICENSE).

Acknowledgments: the Uniswap and Soroswap protocol designs, and the Stellar community.
