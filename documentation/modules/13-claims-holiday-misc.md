# Module: Claims, holidays & misc employee flows

## Claims

**File:** `src/pages/Claims/Claims.jsx`  
**Route:** `/claims`  
**API base:** `/api/leave`

| Action | Path |
|--------|------|
| List / submit expense claim | `GET` / `POST` `/api/leave/claim-expense` |

Manager review: `/manager/claims/:claimId` via `/api/manager/claim-requests/...`.

## Holiday calendar

**File:** `src/pages/Holiday/HolidayCalendarUser.jsx`  
**Route:** `/holiday-calendar`  
**API:** `GET /api/HumanResource/holidays/user?year=&auto_seed=1`

Entry points: logo dropdown (native + web). Removed from dashboard cards in favour of Apply Query.

## Performance (employee)

**File:** `src/pages/Performance/EmployeePerformance.jsx`  
**Route:** `/performance`  
Manager review APIs under `/api/performance/manager/*`.

## Separation / resignation

**Route:** `/separation` (employee initiation)  
Manager: `/manager/resignation`  
Admin: `/admin/resignations`

## News feed

**Route:** `/news-feed`  
HR authors via `/api/HumanResource/news-feed`.

## Downloads

**Route:** `/downloads`  
Native re-open/share of previously saved files (`nativeDownload.js`).

## Public assessment / offer

Unauthenticated routes: `/assessment`, `/assessment/:token`, `/offer-accept`, `/ex-employee-documents`, `/set-password`.
