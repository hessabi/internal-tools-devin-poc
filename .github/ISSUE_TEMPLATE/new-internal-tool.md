---
name: New internal tool
about: Plan a new internal tool on the shared foundation
title: "[tool] "
labels: ["internal-tool"]
---

# Name and purpose

What is the tool called? What work should it help people complete?

Example: **Expense claims** helps the operations team review employee expense
claims and approve payment.

# Who uses it

List the people who use the tool. Start with `analyst`, `manager`, and `admin`.
Add any new roles and explain what each role can do.

Example: An `analyst` reviews claims, a `manager` approves claims over 500, and
an `admin` can approve all claims and view the audit log.

# The record and its fields

Describe the record shown in the tool. Use plain language.

| field | type | example value | sensitive? yes/no |
| --- | --- | --- | --- |
| claim label | text | Expense claim EC-001 | no |
| claimant label | text | Test Employee 001 | no |
| amount | number | 640.00 | no |
| receipt reference | text | test-receipt-001 | yes |

# States

List the states and what each one means.

| state | meaning | example |
| --- | --- | --- |
| pending | Ready for review | Expense claim EC-001 is pending |
| in review | Someone is reviewing it | Expense claim EC-001 is in review |
| approved | Ready for payment | Expense claim EC-001 is approved |
| rejected | Needs correction or cannot be paid | Expense claim EC-001 is rejected |

# Transitions

Describe who can move a record between states. Name thresholds and risk rules.

| from | to | action name | who can do it | thresholds or risk rules | comment required? |
| --- | --- | --- | --- | --- | --- |
| pending | in review | start_review | analyst, manager, admin | Expense claim EC-001 is assigned to the actor | no |
| in review | approved | approve | analyst, manager, admin | Claims over 500 need a manager; the assignee cannot approve | no |
| in review | rejected | reject | analyst, manager, admin | Claims over 500 need a manager; the assignee cannot reject | yes |

# Filters for the list

Which filters help users find records?

| filter | options | example |
| --- | --- | --- |
| status | pending, in review, approved, rejected | Expense claim EC-001: approved |
| amount band | 0 to 500, over 500 | Expense claim EC-001: over 500 |
| currency | USD, EUR | Expense claim EC-001: USD |

# Anything out of scope

List work that should not be included in the first version.

Example: Notifications, payment execution, and receipt file storage are out
of scope.
