# Shared Codebase

The Solviotec HRMS mobile apps reuse the **web-app** React source as the single UI/business-logic bundle.

| Path | Purpose |
|------|---------|
| `../web-app/src/` | React components, pages, API calls, auth |
| `../web-app/src/mobile/` | Capacitor-only shim (API origin) |
| `services/` | Documentation mirror — implement shared TS utilities here in v2 if splitting packages |

**Build flow:** `web-app` → `dist/` → copied into `android-app` and `ios-app` via Capacitor `webDir`.

Do not duplicate business logic in `shared/` until a formal monorepo package is introduced.
