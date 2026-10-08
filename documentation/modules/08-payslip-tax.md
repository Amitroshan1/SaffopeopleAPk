# Module: Payslip & tax

**Primary files:**

- `src/pages/Payslip/Payslip.jsx`
- `src/pages/Payslip/EmployeeForm16.jsx`
- `src/pages/Payslip/EmployeeTaxProjection.jsx`
- Tax declaration pages under `src/pages/` (routes in `App.jsx`)

**API bases:** `/api/accounts`, `/api/auth`  
**Routes:** `/payslip`, `/tax-declaration/*`  
**Gate:** wrapped in `SensitiveDataGate` (extra confirmation / masking where implemented)

## Payslip APIs

| Action | Method | Path |
|--------|--------|------|
| History | GET | `/api/accounts/payslip/history/:userId` |
| CTC breakup | GET | `/api/accounts/ctc-breakup/:userId` |
| Download payroll | GET | `/api/accounts/payroll/:id/download` |
| Generic file | GET | `/api/accounts/file/:path` |
| Homepage (context) | GET | `/api/auth/employee/homepage` |

## Form 16

| Action | Path |
|--------|------|
| History | `/api/accounts/form16/history/:userId` |
| File fetch | `/api/accounts/file/...` |

## Tax projection

| Action | Path |
|--------|------|
| Projection | `/api/auth/tds/projection` |
| CTC | `/api/accounts/ctc-breakup/:userId` |

## Native notes

Downloads should go through blob + `nativeDownload` share sheet. `FLAG_SECURE` may block screenshots of payslip screens — expected behaviour, not a UI bug.
