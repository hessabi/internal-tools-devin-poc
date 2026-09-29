# Power Apps: build-vs-buy research

Prepared 2026-09-29. Prices are Microsoft US list prices. **(unverified)** means no public source confirmed it. **(analysis)** means our reasoning, not a Microsoft claim.

## 1. What Power Apps is

- **Canvas apps**: UI designed on a blank canvas, connected to data sources, logic in Power Fx ([maker overview][maker], [pa.yaml][payaml]).
- **Model-driven apps**: UI generated from a Dataverse data model (forms, views, dashboards) ([model-driven overview][mda]).
- **Code apps**: React, Vue, or similar web apps built in a normal IDE, hosted in Power Platform, with Entra sign-in and connectors callable from JavaScript ([code apps][codeapps], [architecture][codearch]).
- **Dataverse**: the managed data store behind Power Apps (tables, rows, columns) ([Dataverse][dv]).
- **Connectors**: prebuilt Standard and Premium integrations, plus custom connectors that wrap any REST API ([connectors][conn], [custom connectors][custconn]).
- **Power Automate**: cloud flows triggered by events, a button, or a schedule ([cloud flows][flows]).

## 2. Licensing, pricing, and what $250K implies

| Plan | US list price | Source |
|---|---|---|
| Power Apps Premium | $20 per user/month, paid yearly | [pricing][price] |
| Power Apps Premium, 2,000-seat minimum | $12 per user/month | [pricing][price] |
| Power Apps per app | $5 per user/app/month; off sale to most new customers since 2026-01-02 | [FAQ][flowfaq], [end of sale][perappeos] |
| Pay-as-you-go per app meter | $10 per active user/app/month | [meters][payg] |
| Power Automate Premium | $15 per user/month | [FAQ][flowfaq] |
| Dataverse database capacity add-on | $40 per GB/month | [pricing][price], [licensing guide][guide] |

Both Premium plans rise by $2 on 2027-01-01, to $22 and $14 ([price update][priceup]).

**Math** (list price; the real contract and discounts are **(unverified)**):

- All Premium: $20 x 12 = $240 per user per year. $250,000 / $240 = about **1,042 users**. After the 2027 increase: $250,000 / $264 = about **947 users**.
- The 2,000-seat tier is not in play: 2,000 x $12 x 12 = $288,000, which is more than $250K.
- All per app, three apps per user: $5 x 3 x 12 = $180 per user per year, or about **1,389 users**.
- All pay-as-you-go: $250,000 / ($10 x 12) = about **2,083 user-app pairs** active every month.
- Mixed: $48,000 for 100 GB extra Dataverse capacity (100 x $40 x 12) leaves about **842 Premium users**.

**What it implies (analysis).** $250K buys roughly 850 to 1,050 full users at list. With 60 engineers, that is likely most of the company, unless the bill includes other items (Power Automate, capacity, partner fees). Check the license consumption report, which shows purchased, assigned, and used licenses ([licensing overview][skus]).

## 3. Security and governance model

- **Entra ID and Conditional Access**: sign-in uses Entra ID; Conditional Access (MFA, location, device) applies to Power Platform ([identity guidance][ca]). Managed Environments add Conditional Access on individual apps ([Managed Environments][me]). Conditional Access needs Entra ID P1 ([Entra CA][entraca]). Dataverse ends sessions in near real time when an account is disabled ([CAE][cae]).
- **Security roles**: table privileges scoped by business unit; roles are cumulative ([roles][roles], [security concepts][seccon]).
- **Field-level security**: per-column Read, Create, and Update permissions, with optional masking ([column security][fls]).
- **Dataverse auditing**: logs data changes and user access per environment, table, and column; retention 1 day to forever, default 30 days ([auditing][audit], [configure][auditcfg]).
- **DLP (data policies)**: connectors are Business, Non-Business, or Blocked; one app or flow cannot mix Business and Non-Business ([connector classification][dlp]).
- **Managed Environments**: sharing limits, pipelines, IP firewall, customer-managed keys, Lockbox, extended backup, and more ([Managed Environments][me]). Every user in one needs a premium license ([ME licensing][melic]).
- **Compliance**: Power Apps and Power Automate are in scope for Microsoft's SOC 2 Type 2 and PCI DSS attestations ([SOC 2][soc2], [PCI DSS][pci]); full list at [compliance offerings][offer].

## 4. How engineering teams manage it

- **Environments**: Production, Sandbox, Developer, and a shared Default environment not meant for production; one Dataverse database each ([environments][env], [ALM basics][almbasics]).
- **Deployment**: apps ship as solutions: unmanaged in development, managed as the artifact for test and production ([solutions][sol]). Pipeline targets must be Managed Environments ([pipelines][pipe]). GitHub Actions can export, import, and check them ([GitHub Actions][gha]).
- **Source control**: Dataverse Git integration syncs with Azure DevOps or GitHub ([Git integration][git]). Canvas source is `.pa.yaml` ([canvas Git][canvasgit]). Code apps do not support Power Platform Git integration ([code apps][codeapps]).
- **Testing**: Test Studio records canvas UI tests ([Test Studio][teststudio]). Test Engine was deprecated in April 2026 in favor of Playwright ([Test Engine][testengine]).

## 5. Known limitations

- **Delegation and row limits**: nondelegable canvas queries process only the first 500 rows (max 2,000) and can return wrong results ([delegation][deleg]).
- **Request limits**: 40,000 requests per paid user per 24 hours; 6,000 for per app and pay-as-you-go ([request limits][api]).
- **Licensing changes**: the per app SKU went off sale in January 2026 ([end of sale][perappeos]); Premium rises $2 in January 2027 ([price update][priceup]); from February 2027, unlicensed users are blocked where enforcement was lenient, including model-driven apps and Managed Environments ([licensing FAQ][pafaq]).
- **Lock-in**: canvas logic is Power Fx in `.pa.yaml`; we found no documented runtime outside Power Apps **(unverified)** ([pa.yaml][payaml]). Data exports continuously via Azure Synapse Link ([Synapse Link][synapse]). Code apps depend on Microsoft's client library ([architecture][codearch]), so are partly portable **(analysis)**.

## 6. What moving in-house would lose and rebuild (analysis)

Which Dataverse features and connectors the three apps use is **(unverified)**. Assuming a typical setup, the team would have to build and run its own:

- **Identity**: Entra ID sign-in so Conditional Access still applies ([Entra CA][entraca]), plus session revocation ([CAE][cae]).
- **Authorization**: server-side RBAC, plus field-level checks and masking for KYC PII ([column security][fls]).
- **Audit**: append-only log with before and after values and retention ([auditing][audit]).
- **Data controls**: secrets management and egress rules instead of DLP ([DLP][dlp]); backups and restore tests ([Managed Environments][me]).
- **Compliance**: the apps leave Microsoft's SOC 2 and PCI DSS scope ([SOC 2][soc2], [PCI DSS][pci]) and enter the company's own.
- **Integrations and operations**: integrations and jobs instead of connectors and flows ([connectors][conn], [flows][flows]), plus hosting, monitoring, and on-call.

**Gains**: normal Git, CI, and tests; no delegation ceiling; no 2027 price or enforcement exposure; one shared foundation (auth, RBAC, audit) for every new tool. Devin can write this code, but the company still owns review, hosting, security, and audit. Build and hosting cost is not estimated **(unverified)**. **Next step**: pull the consumption report, then build one app in-house and compare.

[maker]: https://learn.microsoft.com/en-us/power-apps/maker/
[mda]: https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/model-driven-app-overview
[codeapps]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
[codearch]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
[dv]: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-intro
[conn]: https://learn.microsoft.com/en-us/connectors/connector-reference/
[custconn]: https://learn.microsoft.com/en-us/connectors/custom-connectors/
[flows]: https://learn.microsoft.com/en-us/power-automate/overview-cloud
[price]: https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing
[priceup]: https://www.microsoft.com/en-us/licensing/news/power-apps-premium-price-update
[flowfaq]: https://learn.microsoft.com/en-us/power-platform/admin/powerapps-flow-licensing-faq
[pafaq]: https://learn.microsoft.com/en-us/power-platform/admin/powerapps-licensing-faq
[perappeos]: https://www.microsoft.com/en-us/licensing/news/power-app-per-app-end-of-sale
[payg]: https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-meters
[guide]: https://www.microsoft.com/licensing/guidance/Power-Platform
[skus]: https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus
[ca]: https://learn.microsoft.com/en-us/power-platform/guidance/adoption/conditional-access
[entraca]: https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview
[cae]: https://learn.microsoft.com/en-us/power-platform/admin/continuous-access-evaluation
[roles]: https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges
[seccon]: https://learn.microsoft.com/en-us/power-platform/admin/wp-security-cds
[fls]: https://learn.microsoft.com/en-us/power-platform/admin/field-level-security
[audit]: https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing
[auditcfg]: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/auditing/configure
[dlp]: https://learn.microsoft.com/en-us/power-platform/admin/dlp-connector-classification
[me]: https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview
[melic]: https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing
[soc2]: https://learn.microsoft.com/en-us/compliance/regulatory/offering-soc-2
[pci]: https://learn.microsoft.com/en-us/compliance/regulatory/offering-pci-dss
[offer]: https://learn.microsoft.com/en-us/compliance/regulatory/offering-home
[env]: https://learn.microsoft.com/en-us/power-platform/admin/environments-overview
[almbasics]: https://learn.microsoft.com/en-us/power-platform/alm/basics-alm
[sol]: https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm
[pipe]: https://learn.microsoft.com/en-us/power-platform/alm/pipelines
[gha]: https://learn.microsoft.com/en-us/power-platform/alm/devops-github-actions
[git]: https://learn.microsoft.com/en-us/power-platform/alm/git-integration/overview
[canvasgit]: https://learn.microsoft.com/en-us/power-platform/alm/git-integration/canvas-apps-git-integration
[payaml]: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/power-apps-yaml
[teststudio]: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/test-studio
[testengine]: https://learn.microsoft.com/en-us/power-platform/test-engine/overview
[deleg]: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/delegation-overview
[api]: https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations
[synapse]: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/export-to-data-lake
