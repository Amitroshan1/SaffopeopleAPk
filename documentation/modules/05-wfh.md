# Module: Work From Home (WFH)

**Primary file:** `src/pages/Wfh/Wfh.jsx`  
**API base:** `/api/leave`  
**Route:** `/wfh`

## Purpose

Employees submit and cancel WFH requests; managers approve elsewhere (`/manager/wfh`).

## APIs

| Action | Method | Path |
|--------|--------|------|
| List / create | GET / POST | `/api/leave/wfh` |
| Cancel | POST (or as implemented) | `/api/leave/wfh/:id/cancel` |

Always include `Authorization: Bearer <token>`.

## UI

Card-based mobile layout under `src/pages/Wfh/ui/`. Keep toast + error patterns consistent with Leaves.
