# Architecture & routing

## Boot sequence

1. `main.jsx` mounts React and installs mobile behaviour:
   - `mobileApiShim` patches `window.fetch` on native so `/api/*` hits `VITE_API_ORIGIN`
   - `installNativeEnhancements()` (status bar, Preferences auth, deep links, file permissions)
2. `App.jsx` wraps the tree in `UserProvider` + `RouterProvider`.
3. Authenticated chrome lives under `AppLayout` (header, outlet).

## Route map (high level)

Defined in `src/App.jsx`.

| Path | Screen | Notes |
|------|--------|-------|
| `/` | HomePage / login entry | Redirects when token present |
| `/dashboard` | Employee home | Punch, cards |
| `/attendance` | Attendance calendar | |
| `/leaves`, `/leaves/apply`, `/leaves/comp-off` | Leave | |
| `/wfh` | WFH | |
| `/queries`, `/queries/inbox` | Apply Query / dept inbox | |
| `/profile`, `/change-password`, `/settings` | Profile | Settings hidden on native dropdown |
| `/payslip`, `/tax-declaration/*` | Payroll / tax | Behind `SensitiveDataGate` |
| `/claims`, `/separation`, `/performance` | Other employee flows | |
| `/holiday-calendar` | Holidays | Also in logo dropdown |
| `/manager/*` | Manager | Role-gated in UI |
| `/hr`, `/updates`, archive/exit | HR | |
| `/admin/*` | Platform admin | |
| `/it/*` | IT | Assets native-emphasized |
| `/employees`, `/employee/:id` | Admin employee mgmt | |

Public (no AppLayout auth chrome): `set-password`, `ex-employee-documents`, `assessment/*`, `offer-accept`.

## API calling conventions

- Relative paths: `/api/<domain>/...`
- Auth header: `Authorization: Bearer ${localStorage.getItem('token')}`
- Domains used by the client:
  - `/api/auth` — login, homepage, profile, punch, master-options
  - `/api/leave` — leave, attendance summary, WFH, claims
  - `/api/query` — tickets / Apply Query
  - `/api/accounts` — payslip, Form 16, CTC
  - `/api/it` — IT assets / NOC
  - `/api/manager` — manager team & approvals
  - `/api/HumanResource` — HR console, holidays
  - `/api/performance` — performance reviews
  - `/api/notifications` — mark-read helpers

### Native fetch shim (`src/mobile/mobileApiShim.js`)

On Capacitor:

1. Rewrites `/api/...`, `/select_role`, `/static/...` → `https://solviotec.com...`
2. Uses `CapacitorHttp` instead of WebView `fetch` (avoids CORS / FormData bugs)
3. Serializes `FormData` with `dataType: 'formData'`
4. Binary URLs matching `/download`, `/file/`, `/files/`, `/static/` return blobs

**Gotcha:** Query attachments use `/files/` (plural). The shim must treat them as binary or history downloads fail.

## Homepage cache

`src/utils/homepageApi.js` → `GET /api/auth/employee/homepage` with short client cache (~45s) and in-flight dedupe. Punch-in/out should force refresh (`force: true`).

## Native UX switches (`isNativeApp()`)

Examples already in product:

- Hide **Settings** from logo dropdown (`Headers.jsx`)
- **Holiday Calendar** in dropdown; **Apply Query** on dashboard (Holiday card removed from home)
- **My Assets** treated as native-focused IT surface
- Phone header height ~72px
- `FLAG_SECURE` on sensitive activity (blocks screenshots / screen share capture)
- Version string under login (`HeroSection` + `versionName`)

## Soft refresh

`APP_SOFT_REFRESH_EVENT` (`homepageApi.js`) lets layouts re-fetch when returning to a tab/route without a full reload.
