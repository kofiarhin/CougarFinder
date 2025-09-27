# CougarFinder — AGENTS

**Codename:** `CougarFinder`  
**Owner:** DevKofi (Kofi)  
**Stack:** MERN (MongoDB, Express (CommonJS), React (Vite), Node), SCSS Modules, React Query + custom hooks, Redux Toolkit (as needed), Jest + Supertest (server), Vitest (client)

## 1) Repo Ground Rules
- JavaScript only (no TypeScript)
- SCSS Modules (`ComponentName.styles.scss`) imported by the component
- Components: Arrow functions + default export
- Backend: Strict MVC in `/server` (no `src/`). CommonJS
- State: React Query for server state + custom hooks
- Env: Use `.env`; never commit secrets

```
root/
  client/
    src/
      components/
      hooks/
      pages/
      styles/
      constants/
  server/
    controllers/
    models/
    routes/
    utils/
    tests/
  package.json
  README.md
  AGENTS.md
  .gitignore
```

## 2) Git Workflow
- Branches: `main` (deployable), `dev` (integration), features `feat/<scope>`, fixes `fix/<scope>`
- Conventional Commits: feat, fix, refactor, chore, docs, test, perf, ci, style
- PR checklist:
  - [ ] Follows rules above
  - [ ] Tests added/updated (server: Jest/Supertest; client: Vitest)
  - [ ] README updated if setup changed
  - [ ] No secrets in diff
  - [ ] Lint/format passes

## 3) Testing & Scripts
- Server tests: Jest + Supertest (only under `/server`)
- Client tests: Vitest (only under `/client`)
- Root scripts:
  - `npm run dev` — run server + client together (concurrently)
  - `npm test` — server-only (Jest)
  - `npm run test:client` — client-only (Vitest)
  - `npm start` — start server (prod)

## 4) Environment
**server/.env**
```
PORT=5000
MONGO_URI=your-mongodb-uri
JWT_SECRET=change_me
CORS_ORIGIN=*
```

**client/src/constants/baseURL.js**
```js
export const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
```

**client/.env**
```
VITE_API_BASE=http://localhost:5000
```

## 5) Patterns
- React
```jsx
import styles from './Component.styles.scss';
const Component = ({ title }) => <h1 className={styles.title}>{title}</h1>;
export default Component;
```

- Routes → Controllers: routes validate + call controller; controllers hold logic

## 6) Health Check
`GET /api/health -> 200 { ok: true, service: 'CougarFinder' }`

## 7) Security (prod)
- Basic rate limiting on auth
- No PII in logs; scrub tokens
- Prefer JWT in Authorization header; cookies httpOnly if used
