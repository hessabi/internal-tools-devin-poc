# AGENTS.md: Internal Tools Foundation (Power Apps replacement prototype)

Read this whole file before you plan or write code. These rules are gates, not suggestions. If you cannot tell whether a change passes a rule, treat it as a fail and fix it.

## What we are building

A fintech company (about 60 engineers) runs three internal apps on Microsoft Power Apps: a KYC review queue, a refunds dashboard, and a feature-flag admin panel. They plan to build at least 10 more. This repo is a prototype that answers one question: can their team use Devin to build internal tools like these on a secure, reusable foundation instead of paying for Power Apps?

The value we are proving is not "Devin can make a form." It is "every new internal tool starts from the same secure base, and adding one is fast."

## Scope (time-boxed to about 2 hours)

Build, in this order, and stop when the box is done:

1. **Foundation**
   - Sign-in with roles. Dev sign-in picks a seeded user; it is gated by an env flag and is off when `NODE_ENV=production`. Put identity behind one interface so a real provider (OIDC: Entra ID or Okta) plugs in later.
   - Role-based access: `analyst`, `manager`, `admin`. Enforce it on the server for every read and write, not only in the UI.
   - Audit log: every create, update, approve, and reject writes an entry (who, what, when, before and after). Entries are append-only. There is a page to view them.
   - A reusable "review queue" pattern: a list with filters, a detail view, and state transitions (for example `pending` to `approved` or `rejected`). Each transition has a role requirement and an optional required comment.
2. **App 1: KYC review queue** built on the foundation. Analysts review; only managers can approve or reject high-risk cases.
3. **App 2: Refunds dashboard** built from the same pattern. Refunds above a configurable threshold need manager approval. This app proves that adding a tool is fast, so reuse the foundation; do not copy-paste App 1.

Out of scope: the feature-flag panel, real SSO, deployment, email or Slack notifications, and a custom design system. Mention these in the README as next steps instead of building them.

## Stack

- Next.js (App Router) with TypeScript in strict mode
- Prisma with SQLite for local runs; the schema stays Postgres-compatible
- Tailwind for styling; keep it plain and readable
- Vitest for tests
- One command to set up and one to run. A reviewer should be able to clone and run it in under 5 minutes.

## Engineering rules

1. **Small files.** Hard cap of 500 lines per source file; start splitting at 400.
2. **Edit in place.** No `New`, `V2`, `Improved`, `Fix`, `Temp` or similar filenames. Change the real file.
3. **Finish it or skip it.** No TODO or FIXME, no commented-out code, no `console.log`, no placeholder "coming soon" screens. If something is out of scope, leave it out and list it in the README.
4. **No silent failures.** No empty catch blocks. Every error becomes a typed error with a code, a clear message in the UI, or a structured log line.
5. **Reuse before you build.** Search for an existing component or helper first. The review-queue pattern must be shared by both apps.
6. **One source of truth.** Roles, states, thresholds and config each live in one place. No magic numbers, no hardcoded URLs, no duplicated types. No `any`, no `@ts-ignore`.
7. **Validate at the boundary.** Every server action or API route validates input with Zod. Never trust the client.
8. **Server is the authority.** Permission checks and state transitions happen on the server. The UI only hides what the server would already refuse.
9. **Data is synthetic and labeled.** Seed data is obviously fake (for example "Test Customer 014", example.com emails). Never use real names, real document numbers, or anything that looks like real PII. Label the seed script and README as synthetic.
10. **No secrets in code.** Local config lives in a gitignored `.env`; commit an `.env.example` with no real values.
11. **Logs never contain PII.** Log IDs, not names, emails, or document numbers.
12. **Time is UTC.** Store and compute in UTC; format at the edge.
13. **Lists paginate.** Every list has a max page size.

## Verify before you call it done

- `typecheck`, `lint`, and `test` all pass.
- The app runs from a fresh clone using only the README steps.
- Tests cover, at minimum:
  - an analyst cannot approve a high-risk KYC case (server rejects it)
  - every state transition writes an audit entry
  - a refund above the threshold requires a manager
- Click through both apps once as each role, and fix anything broken.

"It compiles" is not "it works."

## How to work

- **Plan first.** Before writing code, post a short plan: the data model, the shared review-queue design, and the file layout. Wait for approval.
- **Small, scoped commits** with conventional messages (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- **Stay in scope.** If you think something outside the scope matters, say so in one line and ask. Do not build it.
- **Time box.** Report progress at about 60 and 90 minutes of work. At the 2-hour mark, stop building and write up what exists.
- **Ask, do not guess**, when a requirement is unclear.

## README (required)

The README must cover:

- what this is and the question it answers
- how to set up and run it (exact commands)
- the seeded users and their roles
- how the foundation works, and how to add a new internal tool on it, step by step. This is the most important section.
- what is intentionally out of scope and what production would still need (real SSO, hosting, backups, access reviews, monitoring)

## Writing style

This applies to the README, code comments, commit messages, and UI copy.

- No em dashes. Use a period, comma, or colon instead.
- Plain, concrete language. No marketing words, no filler.
- No emojis.
