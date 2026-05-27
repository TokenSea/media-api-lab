# Media API Lab - BYOK Test Workspace

A Next.js App Router playground for testing official-compatible BYOK media generation APIs.

This app runs in **BYOK (Bring Your Own Key)** mode:

- No Google/NextAuth login.
- No Stripe checkout or app-managed credits.
- The browser stores API URLs and API keys in local storage.
- Requests send the selected API URL through `x-api-url`.
- Requests send the key through `x-api-key` or `Authorization: Bearer <key>`.
- The server forwards provider credentials per request and does not store API keys.

## Pages

- `/`: Seedance 2.0 video task tester.
- `/images`: OpenAI-compatible GPT Image tester.
- `/creations`: public archive of saved Seedance video task records.

## Default Endpoints

The Seedance tester defaults to the Volcengine Ark official video generation task endpoint:

```text
https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
```

The GPT Image tester defaults to the OpenAI image generation endpoint:

```text
https://api.openai.com/v1/images/generations
```

Both defaults can be replaced in the UI when testing another official-compatible gateway.

## API Proxy Contract

All proxy routes require:

- `x-api-url`: upstream provider endpoint.
- `x-api-key` or `Authorization: Bearer <key>`: provider API key.
- `x-auth-mode`: upstream auth header mode, one of `bearer`, `api-key`, or `both`. Defaults to `bearer`.

Video task submission:

- App route: `POST /api/seedance`
- Body: `{ "payload": { ... }, "metadata": { ... } }`
- Upstream request: `POST <x-api-url>`

Video task status polling:

- App route: `POST /api/seedance/check-status`
- Body: `{ "requestId": "..." }`
- Upstream request: `GET <x-api-url>/<requestId>`

Image generation:

- App route: `POST /api/image`
- Body: `{ "payload": { ... } }`
- Upstream request: `POST <x-api-url>`

Archive:

- App route: `GET /api/creations`
- Returns up to 100 saved `Creation` records ordered by newest first.

## Payload Modes

The Seedance page supports:

- Volcengine official `content` payloads.
- Raw JSON payload override.

The GPT Image page supports official-compatible image fields such as `model`, `prompt`, `size`, `quality`, `background`, `output_format`, `output_compression`, `moderation`, `n`, `stream`, `partial_images`, and `user`.

## Persistence

Seedance submissions with a task id are saved to PostgreSQL through Prisma. The `Creation` model stores prompt metadata, media inputs, task status, request id, output URL, and error details.

Image generations are returned directly from `/api/image` and are not saved to the archive.

## Required Environment Variables

| Service | Variable | Description |
| :-- | :-- | :-- |
| Database | `DATABASE_URL` | PostgreSQL connection string used by Prisma. |

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`, select a tester, enter your API URL and API key, then submit a request.

## Scripts

- `npm run dev`: start the Next.js dev server.
- `npm test`: run Node regression tests.
- `npm run lint`: run ESLint.
- `npm run build`: generate Prisma client and build the Next.js app.

## Notes

- The app is focused on API coverage testing, not account management or billing.
- Local file upload is not wired to a fixed provider endpoint in this BYOK build. Use hosted image, video, and audio URLs in the form.
- The Prisma schema no longer includes NextAuth user/session/account tables.
