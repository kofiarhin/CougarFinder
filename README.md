# CougarFinder
CougarFinder is a MERN starter for location-aware matchmaking with an Express API, Socket.IO messaging, and a Vite-powered React landing experience.

## Tech Stack
![MERN](https://img.shields.io/badge/Stack-MERN-green?logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow?logo=javascript&logoColor=white)
![SCSS Modules](https://img.shields.io/badge/Styles-SCSS%20Modules-ff69b4)

## Quick Start
1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/kofiarhin/CougarFinder.git
   cd CougarFinder
   npm install
   npm --prefix client install
   ```
2. Copy the sample environment files and adjust the values for your setup:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
3. Run the local stack (Express API on port 5000, Vite dev server on port 5173):
   ```bash
   npm run dev
   ```

## Environment Variables
### Server (`server/.env`)
| Key | Description | Default |
| --- | --- | --- |
| `PORT` | Port for the Express HTTP server. | `5000` |
| `MONGO_URI` | MongoDB connection string. When omitted in development, the server falls back to an ephemeral in-memory instance. | `mongodb://127.0.0.1:27017/cougarfinder` |
| `JWT_SECRET` | Secret used to sign auth tokens. Required in all environments. | `please-change-me` |
| `JWT_EXPIRES_IN` | JWT expiry window. | `7d` |
| `CORS_ORIGIN` | Allowed origins for CORS (comma-separated). Required in production; `*` is used automatically in development when left blank. | `http://localhost:5173` |
| `USE_IN_MEMORY_DB` | Enables the MongoDB Memory Server fallback outside production. | `true` |
| `UPLOAD_DIR` | Absolute or relative path for persisted uploads. | `server/uploads` |

### Client (`client/.env`)
| Key | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE` | Base URL for API requests from the client. | `http://localhost:5000` |

## Scripts
### Root scripts
| Command | Purpose |
| --- | --- |
| `npm start` | Run the Express server in production mode. |
| `npm run dev` | Run the API and client concurrently (nodemon + Vite). |
| `npm run server` | Start the API with nodemon and development env vars. |
| `npm run client` | Launch the Vite development server only. |
| `npm run build` | Build the React client and ensure server upload directories exist. |
| `npm run build:client` | Build the client bundle under `client/dist`. |
| `npm run build:server` | Prepare server-side upload directories for deployment. |
| `npm test` / `npm run test:server` | Execute the Jest + Supertest API test suite. |
| `npm run test:client` | Execute the Vitest suite inside `client/`. |

### Client workspace
| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Build the static client bundle. |
| `npm run preview` | Preview the built client locally. |
| `npm run test` | Run Vitest against client tests. |

## API Overview
### Health
- `GET /api/health` – Simple service heartbeat.

### Auth
- `POST /api/auth/signup` – Register a user; stores hashed password and profile details.
- `POST /api/auth/login` – Validate credentials and return a signed JWT.

### Profile & Likes
- `GET /api/users/me` – Fetch the authenticated user document.
- `PATCH /api/users/me` – Update profile fields (bio, preferences, location, etc.).
- `POST /api/users/like` – Upsert a like towards another user.

### Images
- `GET /api/users/me/images` – List the caller's stored images.
- `POST /api/users/me/images` – Upload up to four images (`multipart/form-data`, field `images`).
- `PATCH /api/users/me/images/:imageId/primary` – Mark a specific image as primary.
- `DELETE /api/users/me/images/:imageId` – Remove an image and delete its file.

### Matches
- `GET /api/matches` – Browse active users filtered by age range, distance (km), and orientations (`orientations` query param expects comma-separated values).

### Messages
- `GET /api/messages` – Retrieve the latest message per conversation for the current user.
- `GET /api/messages/thread?withUserId=` – Fetch chronological messages with a specific user (supports `limit`).

### WebSocket Events (`/socket.io`)
- **Handshake** – Requires a valid JWT via `Authorization: Bearer <token>` header or `auth.token` payload.
- `message:send` – Persist and broadcast a new message (`{ toUserId, body }`).
- `message:delivered` – Mark a message as delivered and notify the recipient.
- `message:read` – Mark a message as read and notify the recipient.
- `presence:user` (broadcast) – Online/offline presence updates.

## Client Notes
- Bootstrapped with Vite + React 18 and wrapped in a shared `QueryClientProvider` for React Query state management.
- Content strings live in `client/src/content.json`; components pull copy through custom hooks instead of hard-coding.
- Styles use SCSS modules (`*.styles.scss`) imported per component.

## Testing
- API: `npm run test:server` spins up an in-memory MongoDB instance and exercises controllers, routes, and Socket.IO handlers with Jest + Supertest.
- Client: `npm run test:client` runs Vitest against `client/src/__tests__` with JSDOM.

## Deployment
### Server (Render or Heroku)
1. Configure build command `npm install && npm --prefix client install && npm run build`.
2. Set start command `npm start` (Procfile already declares `web: npm start`).
3. Provide required env vars (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`, optional `JWT_EXPIRES_IN`, `USE_IN_MEMORY_DB` false in production).

### Client (Vercel)
1. Deploy the `client/` directory with build command `npm install && npm run build` and output `dist`.
2. Set `VITE_API_BASE` to the deployed server URL.
3. Ensure the API's `CORS_ORIGIN` allows the Vercel domain.

## Folder Structure
```
.
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/
│   │   ├── constants/
│   │   ├── styles/
│   │   └── __tests__/
│   └── package.json
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   ├── tests/
│   └── socket.js
├── scripts/run-with-env.js
├── Procfile
├── package.json
└── README.md
```

## Roadmap
- Expand the client beyond the landing page with authenticated flows for browsing, messaging, and profile management.
- Expose moderation/report management endpoints built around `Report` models.
- Add automated deployment workflows (GitHub Actions) to run tests and trigger platform deploys.
