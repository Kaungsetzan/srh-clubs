# SRH Clubs

A university feature where students propose and vote on clubs, and SRH
ambassadors approve them. Core workflow: propose → students vote → at 10 votes
the club becomes `eligible` → an ambassador approves it.

## Structure

Monorepo with two independent apps under this parent folder:

- `backend/` — Strapi 5 headless CMS (SQLite for dev). Runs on `localhost:1337`.
- `frontend/` — Next.js 15 (App Router, TypeScript, Tailwind). Runs on
  `localhost:3000`. Talks to Strapi's REST API.

Run each in its own terminal:

- Backend: `cd backend && npm run develop`
- Frontend: `cd frontend && npm run dev`

## Data model (Strapi collection types)

**Club**

- `name` (text), `description` (long text)
- `status` (enum): `pending` / `eligible` / `approved` / `rejected`
- `proposer` — relation manyToOne → User (who proposed it)
- `votes` — relation oneToMany → Vote
- `approvedBy` — relation manyToOne → User (which ambassador approved)

**Vote**

- `user` — relation manyToOne → User
- `club` — relation manyToOne → Club
- One vote per user per club (enforced in the custom vote controller, not a DB
  constraint).

**User / roles** — built-in users-permissions plugin. Three roles:

- Public — read-only browsing (find/findOne on Club).
- Authenticated (Student) — vote, propose.
- Ambassador — everything a student can, plus approve. Role name is exactly
  `Ambassador` (capital A) — the approve controller checks this string.

## Custom backend logic

Lives in `backend/src/api/club/`:

- Route file `routes/club-actions.ts` defines two custom POST routes alongside
  the core router.
- Controller `controllers/club.ts` extends the core controller with:
  - `vote` → `POST /api/clubs/:documentId/vote`. Pulls user from the JWT
    (`ctx.state.user`), so the client sends ONLY the club. Checks for an
    existing vote (one-per-user), creates the vote, recounts, and flips status
    to `eligible` at 10 votes.
  - `approve` → `POST /api/clubs/:documentId/approve`. Checks the caller's role
    is `Ambassador` and votes ≥ 10, then sets status `approved` + records
    `approvedBy`. Threshold constant: `VOTE_THRESHOLD = 10`.

## Auth plan (frontend)

JWT-in-httpOnly-cookie via Next.js Server Actions:

- Login server action → calls Strapi `POST /api/auth/local` → stores returned
  JWT in an httpOnly cookie (`httpOnly: true`, `sameSite: 'lax'`, `path: '/'`,
  `secure` only in production).
- Logout action → clears the cookie.
- Middleware → reads the cookie, validates against `/api/users/me?populate=role`,
  attaches user (with role) for route protection.
- Tokens never touch client-side JS. Vote/approve buttons are `"use client"`
  components, but token handling + Strapi calls happen in `"use server"` actions.
- Role check is for UX only (hide buttons, redirect). REAL enforcement is in the
  Strapi controllers — the frontend is never the security boundary.

## Strapi 5 gotchas (IMPORTANT — do not use v4 patterns)

- Fetch single records by `documentId` (a long alphanumeric string), NOT the
  numeric `id`. `GET /api/clubs/1` → 404; use the documentId.
- Response format is FLAT: attributes are at the top level
  (`data.name`, not `data.attributes.name`).
- Relations are NOT populated by default. Use `?populate=*` (or explicit
  populate), and the related field needs `find` permission for the role.
- Use the Document Service API (`strapi.documents('api::club.club')`), not the
  v4 `entityService`.
- List actual routes with `npm run strapi routes:list`.

## Conventions

- Keep cover letters / student-facing copy in clear, simple language (this is a
  student coursework project, not production).
- SQLite is fine for dev/demo; would migrate to PostgreSQL for real production.
