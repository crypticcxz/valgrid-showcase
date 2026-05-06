Valgrid Progressive

Start it
--------

Run:

  sh serve.sh

Then open:

  http://localhost:8080

That is the whole local startup path. `serve.sh` adds OrbStack's Docker
binary path, runs `docker compose down --remove-orphans`, then starts the stack
with `docker compose up --build`.

Environment
-----------

Create `.env` from `.env.example` and fill the required values before starting:

- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `OPENAI_API_KEY`
- `RECONCILER_TOKEN`
- `ELECTRIC_SECRET`

Architecture
------------

The app runs as a Docker Compose stack:

- `proxy`: Caddy. Public entrypoint for the browser.
- `frontend` (compose service): Bun's Vite app on port `5173`. The local `web/`
  directory is mounted into the container as `/app/web`, so UI changes hot reload.
- `backend` (compose service): Bun running the Express API on port `3001`. Source in `api/`.
- `postgres`: PostgreSQL 18 with logical replication enabled.
- `electric`: ElectricSQL shape server connected to Postgres.

Ports:

- `localhost:8080`: the app. Caddy routes `/api/*` to the backend service and all other
  browser traffic to the frontend dev server (compose service names).
- `localhost:8081`: Electric shape traffic only.

Electric is intentionally on `:8081`, not `:8080`. Browsers cap parallel
HTTP/1.1 connections per origin. Electric shape requests can stay open, and if
they share `localhost:8080` with normal API calls, API requests can sit behind
those streams and look like a 20 second delay.

Data flow
---------

- React renders the UI.
- TanStack DB collections hold client-side synced table state.
- `@tanstack/electric-db-collection` subscribes those collections to Electric
  shapes.
- Electric reads Postgres changes over logical replication and serves filtered
  shapes to the browser.
- Collection mutation handlers persist writes through the Express API.
- The backend writes to Postgres with the `postgres` client.
- Strategy code is stored in `strategies.code`.
- Strategy runs execute the stored Python code in a child process.
- Runtime output streams directly from the backend to the browser; it is not
  stored in Postgres.

Main dependencies
-----------------

- Bun: JavaScript runtime, package manager, frontend dev server, and backend
  process runner.
- React: frontend UI.
- React Router: browser routing.
- TanStack React DB: local synced collections for UI state.
- TanStack Electric DB Collection: bridge from TanStack DB collections to
  Electric shapes.
- ElectricSQL: Postgres-to-browser shape sync.
- PostgreSQL: source of truth for application data.
- Express: backend API.
- postgres: SQL client used by the backend.
- Caddy: local reverse proxy.
- google-auth-library: Google login verification.
- react-simple-code-editor: strategy code editor.
- react-markdown, rehype-highlight, and highlight.js: markdown rendering and
  syntax highlighting.
- tweetnacl and bs58: generated Solana-style wallet key/address handling.
- pidusage: runtime process metering.

Useful commands
---------------

Lint:

  bash lint.sh

View running services:

  docker compose ps

Follow logs:

  docker compose logs -f
