# CareerPath AI

CareerPath AI is an early foundation for a student career and skill planner. It will help students connect their current skills to a career goal and a personalized learning roadmap.

**Your skills. Your goal. Your roadmap.**

This first step contains a landing page, routed placeholder screens, and a small Express health-check API. Database, authentication, and AI features are intentionally not implemented yet.

## Tech stack

- React, Vite, TypeScript, and Tailwind CSS
- Express 5 API
- OpenAPI with generated Zod schemas and React Query hooks
- Wouter for frontend routing

## Project structure

This project uses a pnpm workspace. The frontend and backend are separate packages and run as separate services.

```text
artifacts/
  careerpath-ai/       React + Vite frontend
  api-server/          Shared Express API server
lib/
  api-spec/            OpenAPI source of truth
  api-client-react/    Generated React Query client
  api-zod/             Generated Zod schemas
server/
  .env.example         Placeholders for planned service configuration
```

## Local setup

Install the workspace dependencies from the project root:

```sh
pnpm install
```

The Replit workflows run the frontend and API separately. For local development, use two terminals:

```sh
# Terminal 1 — API
PORT=5000 pnpm --filter @workspace/api-server run dev
```

```sh
# Terminal 2 — frontend
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/careerpath-ai run dev
```

The frontend uses the shared `/api` path for API requests. The API health check is available at `/api/health` when both services are served through the workspace proxy; the API server also retains `/api/healthz`.

## Environment variables

`PORT` is currently used by the API server and Vite development server. The Vite workflow also supplies `BASE_PATH`.

`server/.env.example` lists placeholders for planned Supabase, JWT, and Gemini configuration. Those services are not connected in this foundation, so the values are not read by the app yet. Never put real credentials in source files; use Replit Secrets or environment variables when those integrations are added.

## Routes

- `/` — landing page
- `/login` and `/register` — authentication placeholders
- `/dashboard`, `/profile`, `/skills`, `/career-goal`, and `/roadmap` — planner placeholders

## API

- `GET /api/health` returns:

  ```json
  {
    "success": true,
    "message": "CareerPath AI API is running"
  }
  ```

- `GET /api/healthz` is the existing workspace health check.

The OpenAPI source is `lib/api-spec/openapi.yaml`. After changing it, regenerate client and validation code with:

```sh
pnpm --filter @workspace/api-spec run codegen
```
