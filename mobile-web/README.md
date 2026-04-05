# Sprout Mobile Web (PWA)

A mobile‑first Progressive Web App that talks directly to the Sprout relay REST + WebSocket API. Shares UI and utilities from the desktop app via Vite path aliases.

## Dev Setup

- Requirements: Node (pnpm), a running relay (see repo root justfile), optional Nostr extension (NIP‑07) for WebSocket auth.

```bash
cd mobile-web
pnpm install
pnpm dev
# open http://localhost:5174
```

- Shared code alias:
  - `@sprout-shared/*` and `@/shared/*` → `../desktop/src/shared/*`

## Config

- Build‑time: `VITE_RELAY_BASE_URL` (optional). If unset, defaults to page origin.
- Runtime: `/config.json` (optional) — place next to `index.html` at deploy time.

```json
{
  "relayBaseUrl": "https://sprout.divine.video"
}
```

## Auth Quickstart

- REST calls: provide a token via bootstrap helper. We install a default provider:
  - `localStorage.sprout_token` (long‑lived sprout_* token)
  - `sessionStorage.access_token` (JWT)
- Dev helpers are exposed:

```js
// in browser console
sproutAuth.setSproutToken("sprout_...")
sproutAuth.setAccessToken("eyJ...")
sproutAuth.clear()
```

- WebSocket (NIP‑42): requires a NIP‑07 signer (browser extension). If a token is available, it is included as an `auth_token` tag in the AUTH event.

## NIP‑07 Sign‑in (NIP‑98 bootstrap)

Visit `/auth/login` and click “Sign in with Nostr extension”. This:
- Builds a NIP‑98 event (kind:27235) for `POST /api/tokens` with `u`, `method`, and `payload` tags.
- Sends `Authorization: Nostr <base64(event-json)>` and receives a one‑time `sprout_*` token.
- Stores it in `localStorage.sprout_token` and redirects to `/`.

Scopes used by default: `messages:read`, `messages:write`, `channels:read`, `users:read`.

## Notes

- Shared styles and theming come from the desktop app (Catppuccin palette). Tailwind scans both local `src` and `../desktop/src/shared`.
- This package intentionally avoids Tauri APIs.

## Scripts

- `pnpm dev` — run Vite dev server on `5174`
- `pnpm build` — typecheck and build
- `pnpm preview` — preview built assets

