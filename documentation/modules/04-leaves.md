# Module: Leaves

**Primary files:**

- `src/pages/Leaves/Leaves.jsx` — balances + history
- `src/pages/Leaves/ApplyLeavePage.jsx` / `ApplyLeaveModal.jsx` — apply flows
- `src/pages/Leaves/CompOffLedger.jsx` — compensatory off
- `src/pages/Leaves/RegularizationModal.jsx` — attendance regularization (where enabled)

**API base:** `/api/leave`

## Employee APIs

| Action | Method | Path |
|--------|--------|------|
| Balances / details | GET | `/api/leave/LeaveDetails` |
| Apply leave | POST | `/api/leave/apply` |
| Cancel request | POST/DELETE* | `/api/leave/requests/:id/cancel` |
| Comp-off ledger | GET | `/api/leave/compoff/ledger` |
| Optional holidays | GET | `/api/leave/optional-holidays?year=` |
| HR view of emp ledger | GET | `/api/HumanResource/employees/:id/compoff/ledger` |

\*Confirm verb in the calling file if you change it; UI currently uses `fetch` with cancel path above.

## Routes

| Route | Screen |
|-------|--------|
| `/leaves` | List + balances |
| `/leaves/apply` | Full-page apply |
| `/leaves/comp-off` | Comp-off ledger |

## Apply payload

Posted from apply page/modal as JSON (and sometimes multipart when attachments exist — check `ApplyLeaveModal` / `ApplyLeavePage` before changing). Always send Bearer token.

## Manager side

Approvals are under Manager module (`/manager/leaves`), not this folder.
