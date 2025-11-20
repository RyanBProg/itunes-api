# iTunes Day Artists API

This project is a small NestJS application that wraps the public iTunes API with domain-specific logic. The single `/artists/today` endpoint returns music artists whose names start with the same letter as the current day (e.g., Wednesday → “W” → “The Weeknd”). The service layers in runtime day detection, optional filtering/sorting, and defensive error handling so clients always get a predictable payload even when iTunes is flaky.

## Features

- **iTunes integration with runtime day logic** – `ArtistsService` (`src/artists/artists.service.ts`) pulls the `/search` endpoint, extracts `id`, `name`, and `genre`, then filters results with `getDayName` so the response is always contextual to “today”.
- **Article-aware name filtering** – `normaliseName` (`src/common/utils/normaliseName.ts`) strips common English articles (“The”, “An”, “A”) before comparing first letters, ensuring “The Weeknd” counts toward Wednesday.
- **Query customization** – `GetArtistsTodayDto` exposes `sort`, `genre`, `limit`, and `page` knobs. The DTO is validated/transformed globally via `ValidationPipe`, and helpers like `toNumber` keep the conversion explicit.
- **Extras baked in** – Sorting (asc/desc), genre filtering, pagination metadata, and DTO usage satisfy the “Extras” criteria without complicating the controller.
- **Resilience & observability** – An `AbortController` caps iTunes requests at 5 s, all failures surface as `ServiceUnavailableException`s with descriptive messages, and malformed payloads are rejected before they reach consumers. The app is also wrapped with Nest’s `ThrottlerModule` and global caching (`CacheModule`) to guard the upstream API.
- **Configuration safety** – Runtime config goes through a Zod schema (`src/config/env.schema.ts`) so missing `ITUNES_BASE_URL` values are caught on boot.
- **Testable utilities and service layer** – Unit tests cover `ArtistsService`, `getDayName`, `normaliseName`, and `toNumber`, making the filtering and parsing logic easy to evolve.

## API

```
GET /artists/today
```

Query parameters (all optional):

| Name    | Type     | Default | Notes                                      |
| ------- | -------- | ------- | ------------------------------------------ | ------------------------------------- |
| `sort`  | `asc     | desc`   | `asc`                                      | Alphabetical order on the artist name |
| `genre` | `string` | —       | Exact match (case-insensitive) with iTunes |
| `limit` | `number` | `20`    | Max 100, used for pagination size          |
| `page`  | `number` | `1`     | 1-based pagination index                   |

Response payload:

```json
{
  "data": [{ "id": 123, "name": "Metallica", "genre": "Rock" }],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasNextPage": true
  }
}
```

If no artists match the current day/filters, `data` is an empty array with `total: 0`.

## Why it’s built this way

- **Single responsibility modules** – `ArtistsController` only coordinates the DTO and service, while `ArtistsService` owns integration logic. This keeps Nest test modules light and aligns with Nest best practices.
- **Abortable fetch instead of long-lived HTTP clients** – A simple `fetch` + `AbortController` combo is enough for this single endpoint and lets us surface timeouts explicitly without external dependencies.
- **Validation at the edge** – Global pipes validate and transform every DTO, preventing stray query params from leaking into business logic. The DTO defaults also document our contract.
- **Utility extraction** – Helpers like `getDayName`, `normaliseName`, and `toNumber` live in `src/common/utils`, making the service readable and independently testable.
- **Operational guards** – Throttling and caching at the app module level protect the iTunes API and stabilize responses when traffic spikes.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```dotenv
   ITUNES_BASE_URL=https://itunes.apple.com
   ```
3. **Run the API**
   ```bash
   npm run start:dev
   ```
   The service listens on `http://localhost:3000` by default.

## Testing

Unit tests run with Jest:

```bash
npm test
```

E2E tests run with Jest:

```bash
npm test:e2e
```

> **Note:** The current Jest (v30) release requires Node.js ≥ 20 because it uses `os.availableParallelism`. Make sure your runtime meets that requirement or downgrade Jest if you need compatibility with older Node versions.

## Project structure

```
src
├── app.module.ts           # Global throttling, caching, and module wiring
├── main.ts                 # Bootstraps Nest + global ValidationPipe
├── artists
│   ├── artists.controller.ts
│   ├── artists.service.ts
│   ├── dto
│   │   ├── artist.dto.ts
│   │   └── get-artists-today.dto.ts
├── common
│   └── utils
│       ├── getDayName.ts
│       ├── normaliseName.ts
│       └── toNumber.ts
└── config
    ├── config.module.ts
    └── env.schema.ts
```
