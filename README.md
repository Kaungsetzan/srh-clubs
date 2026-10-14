# SRH Clubs

A university web app where students propose and vote on clubs, and SRH
ambassadors approve them.

**How it works:** a student proposes a club → other students vote → at 10 votes
the club becomes `eligible` → an ambassador approves (or rejects) it.

The site also shows university events, news and projects.

## Tech stack

This repository has two separate apps:

| Folder      | What it is                                      | URL                   |
| ----------- | ----------------------------------------------- | --------------------- |
| `backend/`  | Strapi 5 headless CMS (SQLite database for dev) | http://localhost:1337 |
| `frontend/` | Next.js (App Router, TypeScript, Tailwind CSS)  | http://localhost:3000 |

The frontend talks to Strapi through its REST API.

## Getting started

You need Node.js installed. Run each app in its own terminal.

```bash
# Terminal 1 – backend
cd backend
npm install
npm run develop
```

```bash
# Terminal 2 – frontend
cd frontend
npm install
npm run dev
```

On the first backend start, open http://localhost:1337/admin and create an
admin account.
