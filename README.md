# bazario-web

The Bazario storefront, seller area and admin console: a React single-page app that talks to [`bazario-api`](https://github.com/bazario-hq/bazario-api).

## Stack

- React 18, TypeScript, Vite 5, React Router 6
- React Bootstrap (Bootstrap 5) for UI, Recharts for charts, react-hook-form for checkout
- API client generated from the API's OpenAPI spec (`openapi-typescript` + `openapi-fetch`)
- Vitest + React Testing Library for unit tests

## Layout

```
src/
  api/            generated schema types, typed client, auth/refresh handling
  context/        app-wide state (session, cart, wishlist, notifications, toasts)
  components/     shared UI (header, product cards, pagination, gallery…)
  hooks/          data loading and small UI hooks
  lib/            formatting, CSV parsing, categories, analytics wrapper
  pages/          buyer/, seller/, admin/, auth/ screens
  styles/         global CSS and brand fonts
public/           static files served as-is (analytics tag, hero image)
openapi/          the API contract this app was built against (+ where it came from)
tests/unit/       Vitest tests
```

## Running locally

The whole platform (API, Postgres, MinIO, monitoring) runs from [`bazario-infra`](https://github.com/bazario-hq/bazario-infra):

```sh
cd ../bazario-infra
make up-app ENV=dev        # web on http://localhost:5173
```

To run the web app on your host against an API that is already running:

```sh
cp .env.example .env       # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

## API client

The client is generated from the API's committed `openapi.json`, never written by hand:

```sh
npm run api:sync           # copy openapi.json from ../bazario-api (or: -- --ref <sha|tag> to fetch from GitHub)
npm run api:generate       # regenerate src/api/schema.d.ts
npm run api:check          # fails if schema.d.ts is stale
```

`openapi/source.json` records which API commit the spec came from. After syncing, `npm run typecheck` shows every place a contract change breaks the app.

## Tests

```sh
npm test                   # unit tests (Vitest, jsdom)
npm run lint
npm run typecheck
```

## Building

```sh
npm run build              # type-checks, then writes dist/
```

The Docker image has a `dev` target (Vite with hot reload on port 80) and a production target that serves `dist/` with nginx (`nginx.conf`). `VITE_API_URL` is a build argument.
