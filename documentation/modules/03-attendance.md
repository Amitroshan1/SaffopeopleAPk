# Module: Attendance

**Primary file:** `src/pages/Attendance/Attendance.jsx`  
**API base:** `/api/leave` (attendance lives under leave service)

## Purpose

Month calendar of present / absent / leave / holiday status, summary stats, Excel export.

## APIs

### Summary + calendar

`GET /api/leave/attendance/summary?month=<1-12>&year=<YYYY>`

Auth: Bearer token.

Response (simplified): `{ success, calendar[], total_working_days, average_punch_in, average_punch_out, actual_work_hours, expected_work_hours, difference, ... }`

UI maps backend statuses → frontend codes and pads leading empty cells for week start.

### Excel download

`GET /api/leave/attendance/download?month=YYYY-MM`

Returns a file blob. On native, save/share via `nativeDownload.js`.

## Refresh

Uses `useRefreshOnNavigate` so returning to the route refetches the selected month.
