# CougarFinder

CougarFinder is a MERN starter tailored for matchmaking experiences. The project ships with a hardened Express API, a Vite-powered React client, and an end-to-end tooling setup that mirrors production expectations.

## Tech stack
- **Client:** React 18 (Vite), SCSS modules, React Query
- **Server:** Node.js + Express, Mongoose, Socket.IO
- **Testing:** Jest + Supertest (server), Vitest (client)

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or managed). During development you may rely on an ephemeral in-memory instance by setting `USE_IN_MEMORY_DB=true`.

## Environment configuration
1. Install dependencies once per workspace:
   ```bash
   npm install
   npm --prefix client install
   npm --prefix server install
   ```
2. Copy the example environment files and adjust values as needed:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
3. For local development without MongoDB running, set `USE_IN_MEMORY_DB=true` inside `server/.env`. When deploying, remove that flag and point `MONGO_URI` to your production cluster. Always provide a strong `JWT_SECRET` and explicitly list allowed origins in `CORS_ORIGIN` (comma separated for multiple domains).

## Available scripts
All scripts are exposed from the repository root and adhere to the conventions described in the project brief.

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Express (port 5000) and Vite (port 5173) concurrently. |
| `npm run server` | Runs the API with nodemon in development mode. |
| `npm run client` | Starts the Vite dev server only. |
| `npm start` | Boots the Express API for production (`NODE_ENV=production`). Requires a valid `MONGO_URI`. |
| `npm run build` | Builds the React client (`client/dist`). |
| `npm test` | Executes the Jest test suite under `server/tests`. |
| `npm run test:client` | Executes Vitest in the client workspace. |

### Client specific
- `npm --prefix client run build` – builds the React app for static hosting.
- `npm --prefix client run preview` – serves the built client locally.

### Server specific
- `npm run server` (from the root) – reloads on changes with nodemon.

## API health endpoint
The API exposes a health check at `GET /api/health` that returns:
```json
{ "ok": true, "service": "CougarFinder" }
```
Use this route for uptime probes and deployment smoke tests.

## Testing
- Run **server tests** with `npm test`. The suite boots an isolated in-memory MongoDB instance via Jest + Supertest.
- Run **client tests** with `npm run test:client`. The Vitest smoke test renders `<App />` inside a React Query provider to ensure the bundle loads.

## Deployment
- **Server (Render/Heroku):** The repository includes a `Procfile` (`web: npm start`). Configure environment variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`) in your platform dashboard. Render can run the root project with build command `npm install && npm --prefix client install && npm --prefix server install && npm run build` and start command `npm start`.
- **Client (Vercel/Netlify):** Deploy `client/` as a static site. Build command `npm install && npm run build` executed from `client/`. Set `VITE_API_BASE_URL` to the deployed API URL.
- Ensure `CORS_ORIGIN` contains the production client domain(s) before promoting the API.

## Additional notes
- The Express server enforces strict JSON parsing limits, centralised error handling, a `/api/health` heartbeat, and in-memory rate limiting on authentication routes.
- Socket.IO inherits the same CORS configuration as HTTP routes to respect environment restrictions.
- Static uploads live under `/uploads`; change `UPLOAD_DIR` via environment variables when using object storage providers.
