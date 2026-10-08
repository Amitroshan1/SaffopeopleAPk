# Module: Dashboard

**Primary files:** `src/pages/Dashboard/Dashboard.jsx`, `src/utils/homepageApi.js`, `src/pages/Headers.jsx`

## Purpose

Employee home: attendance punch, status chips, and navigation cards (Apply Query, etc.).

## Data load

`GET /api/auth/employee/homepage`  
Headers: `Authorization: Bearer <token>`

Prefer `fetchEmployeeHomepage()` so cache/dedupe stay consistent.

## Punch APIs

Base: `/api/auth`

| Action | Method | Path |
|--------|--------|------|
| Punch in | POST | `/api/auth/employee/punch-in` |
| Punch out | POST | `/api/auth/employee/punch-out` |
| Geo check | GET | `/api/auth/employee/location-check?lat=&lon=` |

Native punch uses Capacitor Geolocation (`nativeLocation.js`) after permission prompts.

After punch, force homepage refresh so UI clocks update.

## Navigation cards (current product behaviour)

- **Apply Query** → `/queries` (replaces former Holiday card on home)
- Holiday calendar available from logo dropdown → `/holiday-calendar`
- Other cards: attendance, leaves, WFH, payslip, etc. (role/plan gated)

## Header / native

- Logo dropdown: Holiday Calendar shown; **Settings** hidden when `isNativeApp()`
- Phone header height tuned ~72px for status bar / notch
