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
| Start review and edit notes | yes | yes | yes |
| Approve or reject low or medium risk | yes | yes | yes |
| Approve or reject high risk | no | yes | yes |
| View audit log | no | yes | yes |

Checks run in server code. A case cannot be approved or rejected by its
assignee. This maker-checker rule applies even when the actor has the required
role. Rejecting a case always requires a comment. High-risk approval and
rejection require a manager or admin.

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
   `prisma/schema.prisma`, run `npm run db:push`, and add synthetic seed rows
   in `prisma/seed.ts`.
2. **Mark sensitive fields.** Add `receiptReference` to `REDACTED_FIELDS` in
   `src/lib/audit/record.ts`. Do not include it in list columns.
3. **Define states.** Reuse `ReviewStatus` for these four states. If the tool
   needs a different state, extend the shared state schema explicitly and
   update its labels and transition types.
4. **Define transitions and rules.** In
   `src/apps/expense-claims/config.tsx`, add a `transitions` array with
   `allowedRoles`, `requireComment`, and the `notAssignee` guard. Add a named
   `CLAIM_MANAGER_THRESHOLD = 500` in
   `src/apps/expense-claims/config.ts` or a limits file. Use that constant in
   the threshold guard.
5. **Define filters.** Add the status, amount band, and currency entries to
   the `filters` array in the queue configuration. Keep option values in one
   configuration source.
6. **Add the repository.** Create
   `src/apps/expense-claims/repository.ts` to translate queue filters and
   pagination into Prisma queries.
7. **Add server actions.** Create
   `src/apps/expense-claims/actions.ts` with thin actions that call the shared
   transition and notes functions, then revalidate the route.
8. **Add two thin pages.** Create `src/app/expense-claims/page.tsx` for the
   list and `src/app/expense-claims/[id]/page.tsx` for the detail view. Both
   obtain a session and render shared queue components.
9. **Add navigation.** Add an Expense claims link to `src/app/page.tsx`.
10. **Copy the tests.** Copy the integration test patterns in
    `tests/permissions.test.ts`, `tests/audit.test.ts`,
    `tests/transitions.test.ts`, `tests/auth.test.ts`, and
    `tests/list.test.ts`. Add tests for the 500 threshold, maker-checker,
    comments, audit changes, and list filters.

The target is one schema model, one queue configuration, one repository file,
one actions file, and two thin pages. Authorization and transition behavior
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
    audit/page.tsx
  apps/kyc/
    config.tsx
    repository.ts
    actions.ts
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
```
