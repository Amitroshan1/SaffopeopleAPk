# Module: Admin & Accounts

## Platform Admin

**Files:** `src/pages/Admin/*`, layout `AdminLayout.jsx`, hub config `adminHubConfig.js`  
**Routes:** `/admin`, `/admin/customers`, `/admin/leaves`, `/admin/queries`, `/admin/claims`, `/admin/resignations`, `/admin/deployment-guide`

Also employee admin:

| Route | Screen |
|-------|--------|
| `/employees` | Employee list |
| `/employee/:id` | Details |
| `/employee/:id/punches` | Punch history |

APIs are concentrated in `Admin/Data.js` and per-page fetches — read the specific admin page before changing contracts.

## Accounts (finance persona)

**File:** `src/pages/Account/Account.jsx`  
**Route:** `/account`  
**API overlap:** `/api/accounts` (shared with payslip)

Accounts users manage payroll-side views; employees consume payslips under `/payslip`.

## Sensitive data

Payslip/tax routes use `SensitiveDataGate`. Admin/Accounts tools may show PII — never log tokens or full payroll payloads in the client.
