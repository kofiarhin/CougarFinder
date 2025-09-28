# CougarFinder — Operational Playbook

## Global Rules
- JavaScript only across client and server; no TypeScript or alternative transpilers.
- Prefer arrow functions everywhere (controllers, services, React components, hooks, utilities).
- Backend uses Express + Mongoose in a strict MVC layout under `server/` with CommonJS (`require` / `module.exports`).
- Frontend uses Vite + React with SCSS Modules (one `ComponentName.styles.scss` per component) and default exports.
- React Query manages server state; wrap data access in custom hooks.
- Keep environment-specific values in `.env` files (no hard-coded secrets). Respect `CORS_ORIGIN` wildcard in development and explicit origins in production.
- Authentication uses JWT signed with `JWT_SECRET`. Tokens travel via `Authorization: Bearer` header for HTTP and Socket.IO.
- Tests live on their side: Jest + Supertest under `server/tests`, Vitest under `client/src/__tests__`.
- Follow the README for scripts, endpoints, env vars, and deployment expectations. Update docs when those change.

## Agents
### Repo Guard
- Enforces stack conventions (JS only, arrow functions, CommonJS server, SCSS Modules, React Query usage).
- Blocks merges if linting conventions, folder structure, or security requirements (JWT, env vars, wildcard CORS in dev) are violated.

### API Generator (`:create:crud:[resource]`)
- Builds model-aware CRUD endpoints under `server/routes`, `server/controllers`, optional `server/services`.
- Must wire routes -> controllers -> models, add tests, and document endpoints in README.

### Model Wizard (`:create:model:[name]`)
- Generates Mongoose models aligned with existing schemas and relationships.
- Updates related controllers/services and seeds tests/data when necessary.

### UI Builder (`:create:component:[Name]`)
- Creates React components plus matching `Name.styles.scss` modules.
- Hooks components into routing or parent views and ensures responsive styles.

### Test Author
- Adds or updates Jest + Supertest suites for API work and Vitest suites for client work.
- Keeps fixtures isolated and leverages the in-memory MongoDB test harness.

### Docs Scribe
- Maintains `README.md` and related docs when APIs, env vars, scripts, or workflows change.
- Ensures tables, endpoint lists, and deployment notes mirror the current code.

### Release Butler
- Runs all tests, updates changelog/release notes, tags the release, and outlines deploy commands.
- Verifies that README deployment instructions still match the commands executed.

## Code Templates
### Express Controller (CommonJS + Arrow Function)
```js
const someService = require('../services/someService');

const listItems = async (req, res, next) => {
  try {
    const items = await someService.list();
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listItems
};
```

### React Component + SCSS Module
```jsx
import styles from './ComponentName.styles.scss';

const ComponentName = ({ title }) => {
  return <h1 className={styles.title}>{title}</h1>;
};

export default ComponentName;
```

### React Query Hook
```js
import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '../constants/baseURL';

const fetchItems = async () => {
  const response = await fetch(`${BASE_URL}/api/items`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }

  return response.json();
};

const useItems = (options = {}) => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    ...options
  });
};

export default useItems;
```

## PR Checklist
- [ ] Arrow functions used for all new functions/components; React components default-exported.
- [ ] Server code sticks to CommonJS and lives inside the MVC structure (`controllers`, `routes`, `models`, `services/utils`).
- [ ] Each React component owns a dedicated SCSS module with matching import path.
- [ ] JWT auth flow, env vars, and CORS configuration remain secure; no secrets committed.
- [ ] Tests added or updated for both server (Jest + Supertest) and client (Vitest) as applicable.
- [ ] README and docs updated whenever APIs, env vars, scripts, or deployment steps change.
