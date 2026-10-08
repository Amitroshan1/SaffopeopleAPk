# Module: Manager

**Primary files:**

- `src/pages/Manager/Manager.jsx`
- `src/pages/Manager/api.js` — shared client
- Subpages: leaves, WFH, resignation, probation, claims, performance

**API base:** `/api/manager` (+ `/api/performance/manager/*`)

## Routes

| Route | Purpose |
|-------|---------|
| `/manager` | Hub / profile / team |
| `/manager/leaves` | Leave approvals |
| `/manager/wfh` | WFH approvals |
| `/manager/resignation` | Resignation / offboarding |
| `/manager/probation` | Probation reviews |
| `/manager/claims/:claimId` | Claim detail |
| `/manager/performance-reviews` | Performance queue |

## Notable APIs (`api.js`)

| Area | Path examples |
|------|----------------|
| Scope / profile | `/api/manager/scope`, `/api/manager/profile` |
| Team | `/api/manager/team-members`, `/api/manager/team-attendance` |
| Offboarding / NOC | `/api/manager/team-offboarding`, NOC list/action helpers |
| Claims | `/api/manager/claim-requests/:id`, file URLs |
| Probation | `/api/manager/probation-reviews`, `/api/manager/probation-review` |
| Increments | `/api/manager/increment-proposals`, compensation-band-hint |
| Performance | `/api/performance/manager/summary`, `/queue`, `/review/:id` |

## UI structure

Composable cards under `Manager/comps/` (leave cards, WFH, resignation, profile card). Keep approval action patterns (approve/reject + comment) consistent when adding request types.
