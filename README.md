# Internal Tools Foundation

## What this is and the question it answers

This repository is a synthetic prototype for a reusable foundation for
internal tools. It includes sign-in, roles, server-side authorization, audit
logging, and a review queue.

It answers this question: can a team build internal tools on the same secure
base instead of copying application infrastructure or relying only on Power
Apps? The intended value is that every new internal tool starts from the same
base and adding one is fast.

## Setup and run

Prerequisites:

- Node 24 LTS
- npm

Run:

```sh
git clone https://github.com/hessabi/internal-tools-devin-poc.git
cd internal-tools-devin-poc
npm run setup
npm run dev
```

Open http://localhost:3000.

Useful checks:

```sh
npm run typecheck
npm run lint
npm test
```

The setup command creates a local `.env` from `.env.example` when needed,
installs dependencies, creates the SQLite database, and loads seed data. All
seeded users and records are synthetic.

## Seeded users and roles

| Name | Email | Role |
| --- | --- | --- |
| Test Analyst 01 | analyst.one@example.com | analyst |
| Test Analyst 02 | analyst.two@example.com | analyst |
| Test Manager 01 | manager.one@example.com | manager |
| Test Admin 01 | admin.one@example.com | admin |

Development sign-in is gated by `AUTH_DEV_LOGIN`. It is disabled when
`NODE_ENV=production`.

## How the foundation works

### Identity and permissions

The `AuthProvider` interface in `src/lib/auth/provider.ts` separates identity
from the application. The local `DevAuthProvider` uses a signed, httpOnly
cookie. A real OIDC provider can replace it at the provider selection point
in `src/lib/auth/index.ts`.

The permission matrix is:

| Capability | analyst | manager | admin |
| --- | --- | --- | --- |
| View KYC queue and case detail | yes | yes | yes |
| Start review, edit notes before a decision | yes | yes | yes |
| Approve or reject low or medium risk | yes | yes | yes |
| Approve or reject high risk | no | yes | yes |
| View refunds dashboard and refund detail | yes | yes | yes |
| Start a refund review | yes | yes | yes |
| Approve or reject refunds of 500 USD or less | yes | yes | yes |
| Approve or reject refunds over 500 USD | no | yes | yes |
| View audit log | no | yes | yes |

Checks run in server code. A case or refund cannot be approved or rejected by
its assignee. This maker-checker rule applies even when the actor has the
required role. Rejecting always requires a comment. High-risk KYC decisions and
refund decisions above the threshold require a manager or admin.

### Audit log

The audit log stores the actor, action, entity type, entity ID, changed fields,
optional comment, and UTC creation time. It stores only fields whose values
changed between the before and after records. Customer email and `updatedAt`
are redacted from changes. A Prisma query extension rejects audit updates and
deletes, so entries are append-only through the application client.

### Review queue pattern

`src/lib/review-queue/` provides shared validation, role checks, pagination,
transition execution, audit writes, and UI components. Each tool supplies a
typed configuration, a repository, thin server actions, and two pages.

This is a trimmed excerpt from the real KYC configuration in
`src/apps/kyc/config.tsx`:

```tsx
const kycQueue = defineReviewQueue({
  key: "kyc",
  basePath: "/kyc",
  entityType: "kyc_case",
  readRoles: ROLES,
  transitions: [
    {
      action: "approve",
      from: ["in_review"],
      to: "approved",
      allowedRoles: approvalRoles,
      guard: notAssignee,
    },
  ],
  filters: [
    { key: "status", options: statusOptions },
    { key: "riskLevel", options: riskOptions },
  ],
  repository: kycRepository,
});
```

Both tools are registered in `src/apps/registry.ts`. The home page, the
header navigation, and the audit log entity links read from that list, so a
new tool appears in all three once it is registered.

### Tools built on the pattern

- **KYC review queue** (`src/apps/kyc/`, `/kyc`): analysts review synthetic
  customer cases; high-risk decisions need a manager or admin.
- **Refunds dashboard** (`src/apps/refunds/`, `/refunds`): support agents
  review synthetic refund requests. Refunds over
  `REFUND_MANAGER_THRESHOLD_CENTS` (500 USD, in `src/apps/refunds/limits.ts`)
  need a manager or admin. Amounts are stored as integer cents. The order
  reference is treated as sensitive: it appears on the detail page but is
  redacted from audit changes and left out of the list. Out of scope for the
  first version: sending refunds to a payment processor, customer
  notifications, links to real orders, partial refunds, and currencies other
  than USD.

List requests use a default page size of 20 and a maximum page size of 50.
Filter keys and values are checked with Zod at the server boundary. Errors use
typed application codes such as `FORBIDDEN`, `VALIDATION`,
`INVALID_TRANSITION`, and `COMMENT_REQUIRED`.

## Adding a new internal tool, step by step

The example below is a filled plan for a fictional **Expense claims** tool.

### Example plan

**Name and purpose:** Expense claims. Review employee expense claims and
approve payment.

**Who uses it:** Analysts review claims, managers approve claims over 500, and
admins can approve all claims and investigate audit entries. Any new role must
be named here before implementation.

**The record and its fields:**

| Field | Type | Example value | Sensitive? |
| --- | --- | --- | --- |
| claim label | text | Expense claim EC-001 | no |
| claimant label | text | Test Employee 001 | no |
| amount | number | 640.00 | no |
| currency | text | USD | no |
| receipt reference | text | test-receipt-001 | yes |
| notes | long text | Hotel receipt attached | no |

**States:**

| State | Meaning | Example |
| --- | --- | --- |
| pending | Ready for review | Expense claim EC-001 is pending |
| in review | Someone is reviewing it | Expense claim EC-001 is in review |
| approved | Ready for payment | Expense claim EC-001 is approved |
| rejected | Needs correction or cannot be paid | Expense claim EC-001 is rejected |

**Transitions:**

| From | To | Action name | Who can do it | Thresholds or risk rules | Comment required? |
| --- | --- | --- | --- | --- | --- |
| pending | in review | start_review | analyst, manager, admin | Expense claim EC-001 is assigned to the actor | no |
| in review | approved | approve | analyst, manager, admin | Claims over 500 need a manager; the assignee cannot approve | no |
| in review | rejected | reject | analyst, manager, admin | Claims over 500 need a manager; the assignee cannot reject | yes |

**Filters for the list:**

| Filter | Options | Example |
| --- | --- | --- |
| status | pending, in review, approved, rejected | Expense claim EC-001: approved |
| amount band | 0 to 500, over 500 | Expense claim EC-001: over 500 |
| currency | USD, EUR | Expense claim EC-001: USD |

**Anything out of scope:** Notifications, payment execution, and receipt
file storage are out of scope for the first version.

### Implementation steps

1. **Add the record and fields.** Add an `ExpenseClaim` model to
   `prisma/schema.prisma` with a named assignee relation on `User`, run
   `npx prisma generate` and `npm run db:push`, and add synthetic seed rows
   in `prisma/seed.ts`. Add the new table to the `deleteMany` calls at the top
   of the seed. Store money as integer minor units (cents) and format it with
   `formatMoney` from `src/lib/format.ts`.
2. **Mark sensitive fields.** Add `receiptReference` to `REDACTED_FIELDS` in
   `src/lib/audit/record.ts`. Do not include it in list columns.
3. **Define states.** Reuse `ReviewStatus` for these four states. If the tool
   needs a different state, extend the shared state schema explicitly and
   update its labels and transition types.
4. **Define transitions and rules.** In
   `src/apps/expense-claims/config.tsx`, add a `transitions` array with
   `allowedRoles`, `requireComment`, a `successMessage` shown after the
   action succeeds, and the `notAssignee` guard. Set `notesLockedStatuses` to
   the states where notes become read-only. Add a named
   `CLAIM_MANAGER_THRESHOLD_CENTS = 500_00` in
   `src/apps/expense-claims/limits.ts`. Use that constant in the
   `allowedRoles` function and in the repository filter so the rule and the
   filter cannot drift apart. Choice fields such as a reason list live in
   their own file with a Zod enum and labels, like `src/apps/refunds/reasons.ts`.
5. **Define filters.** Add the status, amount band, and currency entries to
   the `filters` array in the queue configuration. Keep option values in one
   configuration source. A derived filter such as amount band is translated
   into a Prisma `where` clause in the repository; see `amountFilter` in
   `src/apps/refunds/repository.ts`.
6. **Add the repository.** Create
   `src/apps/expense-claims/repository.ts` to translate queue filters and
   pagination into Prisma queries.
7. **Add server actions.** Create
   `src/apps/expense-claims/actions.ts` with thin actions that call the shared
   transition and notes functions, then revalidate the route.
8. **Add two thin pages.** Create `src/app/expense-claims/page.tsx` for the
   list and `src/app/expense-claims/[id]/page.tsx` for the detail view. Both
   obtain a session and render shared queue components. Read the title and
   `basePath` from the queue configuration instead of repeating them. Only
   render the notes section when the queue sets `editableNotesField`.
9. **Register the tool.** Add the queue configuration to `reviewQueues` in
   `src/apps/registry.ts`. The home page, the header navigation, and the
   audit log entity links all read from that list.
10. **Copy the tests.** Add a `createExpenseClaim` fixture to
    `tests/helpers/fixtures.ts` and add the new table to `resetDatabase`.
    Copy the integration test patterns in `tests/permissions.test.ts`,
    `tests/audit.test.ts`, `tests/transitions.test.ts`, `tests/auth.test.ts`,
    and `tests/list.test.ts` into one `tests/expense-claims.test.ts`. Cover
    the 500 threshold for both approve and reject, maker-checker, required
    comments, audit changes with sensitive fields redacted, and list filters.
    `tests/refunds.test.ts` is a complete example.

The target is one schema model, one queue configuration, one repository file,
one actions file, two thin pages, one registry entry, and one test file. Authorization and transition behavior
remain shared server logic rather than copied page code.

## Out of scope and what production would still need

This prototype does not include a feature-flag panel, real SSO or OIDC,
deployment or hosting, notifications, or a design system.

Moving this foundation into production would still require:

- Identity with Conditional Access and session revocation.
- Server-side RBAC with field-level masking.
- Audit retention.
- Secrets and egress controls.
- Backups and restore tests.
- A defined compliance scope.
- Monitoring and on-call.
- Access reviews.

Known risks in this prototype that production must close:

- Audit entries are append-only only in the Prisma client (`src/lib/db.ts`).
  The database must also deny `UPDATE` and `DELETE` on `AuditEntry` through
  grants or triggers. The seed script uses a plain client and can clear the
  table, which is intended for local data only.
- Notes are locked once a case is approved or rejected, but any role can edit
  them before that. Decide whether some roles or states should be read-only.
- The dev session cookie is an HMAC of the user id with no expiry or
  revocation. It is acceptable for local sign-in only; the OIDC provider must
  own session lifetime and revocation.
- Roles, states, and risk levels are plain strings validated by Zod in the
  app. The database has no check constraints, so a direct write can store an
  invalid value. Add Postgres enums or check constraints.

These production concerns are described in
[`docs/power-apps-research.md`](docs/power-apps-research.md), section 6.

## Project layout

```text
prisma/
  schema.prisma
  seed.ts
src/
  app/
    page.tsx
    sign-in/page.tsx
    kyc/page.tsx
    kyc/[id]/page.tsx
    refunds/page.tsx
    refunds/[id]/page.tsx
    audit/page.tsx
  apps/
    registry.ts
    kyc/
      config.tsx
      repository.ts
      actions.ts
      risk.ts
      types.ts
    refunds/
      config.tsx
      repository.ts
      actions.ts
      limits.ts
      reasons.ts
      types.ts
  lib/
    auth/
    audit/
    config/
    review-queue/
tests/
  helpers/fixtures.ts
  permissions.test.ts
  audit.test.ts
  transitions.test.ts
  auth.test.ts
  list.test.ts
  notes.test.ts
  refunds.test.ts
```
