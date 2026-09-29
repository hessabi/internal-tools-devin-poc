# Internal Tools Foundation

This repository is a synthetic prototype for a reusable internal tools
foundation. It answers whether a small engineering team can build secure,
role-aware review tools without copying application infrastructure.

## Setup

Use Node 24 and npm.

```sh
cp .env.example .env
npm run setup
npm run dev
```

Open http://localhost:3000. The setup command installs dependencies, generates
the Prisma client, creates the local SQLite database, and loads synthetic data.

Useful commands:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

All seeded names and email addresses are synthetic. No seed record refers to a
real person.

## Seeded users

| Name | Email | Role |
| --- | --- | --- |
| Test Analyst 01 | analyst.one@example.com | analyst |
| Test Analyst 02 | analyst.two@example.com | analyst |
| Test Manager 01 | manager.one@example.com | manager |
| Test Admin 01 | admin.one@example.com | admin |

Development sign-in is available only when `AUTH_DEV_LOGIN=true` and
`NODE_ENV` is not `production`.

## Foundation design

The Prisma schema uses string fields for role, review status, risk level, and
audit action. Zod schemas in `src/lib/config` are the single source of truth
for those values. The Prisma client is shared through a global singleton.
Audit entries are append-only through a Prisma query extension.

Authentication uses the `AuthProvider` interface. The local provider stores a
signed, httpOnly session cookie. Server actions and pages obtain a session with
`requireSession`, and role checks use the shared permission map. Client forms
can improve navigation, but every read and write checks on the server.

The review queue pattern is in `src/lib/review-queue`. It separates queue
configuration from repository access, transitions, validation, and UI. Lists
use bounded pagination. State transitions and audit writes run in one database
transaction. Audit changes omit customer email and updated timestamps.

## Adding a new internal tool

1. Add the Prisma model with synthetic-safe fields and a repository adapter
   that implements `QueueRepository`.
2. Add Zod values for any new role, state, risk value, or filter option in the
   shared configuration location.
3. Define a queue config with a title, base path, entity type, filters,
   columns, detail fields, editable notes field, and explicit transitions.
4. Make every transition declare its source states, target state, required
   comment behavior, allowed roles, and any guard such as self-approval.
5. Add thin server actions that call `runTransition` and `updateNotes`, then
   revalidate the new route.
6. Add list and detail pages that obtain a session, call the generic actions,
   and render the shared queue components.
7. Add navigation and an audit link through the shared permission map.
8. Add tests for role checks, invalid transitions, required comments, audit
   entries, and pagination. Keep seed records synthetic and deterministic.

## Out of scope

This prototype does not include the refunds dashboard, feature flag panel,
real OIDC or SSO, hosting, notifications, deployment, or a custom design
system. Production work would also need backups, access reviews, monitoring,
secret management, and a managed database.
