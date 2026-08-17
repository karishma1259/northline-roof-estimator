# Northline Roofing — Config-Driven Estimator & Owner Panel

A two-surface app built for Northline Roofing & Exteriors:

- **Public estimator** (`/`) — a mobile-friendly, multi-step form a homeowner fills in to get a cost range. Every question, label, option, and rate is fetched from the API at runtime; nothing about the questions is hardcoded in the front-end.
- **Owner panel** (`/admin`) — login-protected. Lets a non-technical owner edit prices/labels, turn questions on/off, add questions, and view captured leads, with changes going live immediately (no redeploy).

See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind what was and wasn't built, and [`AI_LOG.md`](./AI_LOG.md) for how AI tools were used on this build.

## Stack

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** React (Vite) + React Router
- **Auth:** JWT, single owner account (env-configured credentials)

## Project structure

```
backend/     Express API, Mongoose models, calc engine, seed script
frontend/    React app (estimator + owner panel)
DECISIONS.md
AI_LOG.md
```

## Running locally (from a clean clone)

### 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster works fine)

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: paste your MONGODB_URI, set OWNER_USERNAME / OWNER_PASSWORD, set JWT_SECRET to any long random string
npm install
npm run seed    # loads the client's seed config + seed leads into your DB (safe to run once)
npm run dev     # starts the API on http://localhost:4000
```

### 3. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_API_URL=http://localhost:4000 (or your deployed backend URL)
npm install
npm run dev     # starts the app on http://localhost:5173
```

Open `http://localhost:5173` for the estimator, `http://localhost:5173/admin` for the owner panel.

### Test credentials (owner panel)

Whatever you set `OWNER_USERNAME` / `OWNER_PASSWORD` to in `backend/.env`. For the deployed demo:

- **URL:** _(fill in after deploying — see below)_
- **Username:** _(fill in)_
- **Password:** _(fill in)_

## Environment variables

**backend/.env**

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default 4000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign owner-panel session tokens |
| `OWNER_USERNAME` / `OWNER_PASSWORD` | Owner panel login credentials |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |

**frontend/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend API |

## Deploying (free-tier friendly)

1. **Database:** create a free MongoDB Atlas cluster, add a database user, and allow network access from anywhere (0.0.0.0/0) since the API host's IP isn't static on most free hosts.
2. **Backend:** deploy the `backend/` folder to [Render](https://render.com) (or Railway) as a Web Service. Build command: `npm install`. Start command: `npm start`. Add the same env vars as `.env.example`. After the first deploy, run `npm run seed` once (Render's shell, or run it locally pointed at the Atlas URI) to load the seed data.
3. **Frontend:** deploy the `frontend/` folder to [Vercel](https://vercel.com) (or Netlify) as a static Vite build. Build command: `npm run build`. Output directory: `dist`. Set `VITE_API_URL` to your Render backend URL.
4. Update `CORS_ORIGIN` in the backend's env vars to your deployed frontend URL, then redeploy the backend.

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/config` | Public | Sanitized question set for the estimator (no rates) |
| POST | `/api/estimate` | Public | Submits answers + contact info, returns a calculated estimate, stores the lead |
| POST | `/api/admin/login` | Public | Owner login, returns a JWT |
| GET | `/api/admin/config` | Owner | Full config including rates |
| PUT | `/api/admin/config` | Owner | Saves a new config version |
| GET | `/api/admin/leads` | Owner | Lists captured leads |
