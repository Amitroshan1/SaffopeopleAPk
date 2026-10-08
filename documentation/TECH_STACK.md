# Tech stack

## Runtime & UI

| Layer | Choice | Notes |
|-------|--------|-------|
| UI | React 19 | Functional components, hooks |
| Routing | react-router-dom 7 | `createBrowserRouter` in `src/App.jsx` |
| Build | Vite 7 | Modes: default, `production`, `mobile` |
| CSS | Tailwind 4 + module CSS | Mixed; Query/Attendance use dedicated CSS |
| Icons | lucide-react, react-icons, Heroicons | Prefer existing patterns in the file you edit |
| Toasts | react-toastify | App-level `ToastContainer` |
| Dates | dayjs | Attendance / leave date helpers |
| JWT | jwt-decode | Client-side claims when needed |

## Mobile (Capacitor 8)

| Package | Role |
|---------|------|
| `@capacitor/core` / `cli` / `android` | Shell (^8.x; currently 8.5.x) |
| `@capacitor/app` | Back button, app state |
| `@capacitor/geolocation` | Punch location |
| `@capacitor/filesystem` + `@capacitor/share` | Downloads / share sheet |
| `@capacitor/preferences` | Native auth storage bridge |
| `@capacitor/status-bar` / `splash-screen` / `keyboard` | Chrome UX |
| `@capacitor/camera` | Permissions / capture where used |

App id / name: see `capacitor.config.json` → `com.saffo.hrms` / **Saffo People**.

**Toolchain:** Node 22+ recommended · **JDK 21+** required for Capacitor 8 / AGP 8.13 · Gradle wrapper **8.14.x**

### Android SDK (`android/variables.gradle`)

| Setting | Value |
|---------|--------|
| `minSdkVersion` | **24** (Android 7.0) |
| `compileSdkVersion` | **36** |
| `targetSdkVersion` | **36** |

## Environment files

| File | When used |
|------|-----------|
| `.env.mobile` | `npm run build:mobile` → `VITE_API_ORIGIN=https://solviotec.com` |
| `.env.production` | Production web build |
| (none / local) | `npm run dev` — relative `/api` via Vite proxy if configured |

Native fallback if env missing: `mobileApiShim.js` defaults API origin to `https://solviotec.com`.

## Important source folders

```
web-app/
  src/
    App.jsx                 # Routes
    main.jsx                # Boot + native install
    pages/                  # Feature screens (by domain)
    utils/                  # homepageApi, shared helpers
    context/                # UserProvider etc.
    mobile/
      mobileApiShim.js      # Native fetch rewrite + FormData + binary
      native/               # Bootstrap, back, downloads, location, auth
  android/                  # Capacitor Android project
  capacitor.config.json
  documentation/            # This folder
```

## Auth & session keys (localStorage)

| Key | Meaning |
|-----|---------|
| `token` | JWT after OTP verify |
| `lastActivityAt` | Idle / activity tracking |
| Plan/features | Set via login response helpers (`setPlanContext`) |

On native, Preferences mirrors session keys (`nativeAuthStorage.js`).

## Versioning (Android)

In `android/app/build.gradle` → `defaultConfig` (current):

| Field | Current value | Notes |
|-------|---------------|--------|
| `versionCode` | **3** | Integer; bump every Play Store upload |
| `versionName` | **"1.0.0"** | User-visible; also shown under login on HeroSection |

Release signing: configure in **Android Studio** (keystore at e.g. `C:\Users\pc\AndroidKeys\saffo-people.jks`). Do **not** put keystore passwords in `build.gradle` committed to git.

Upgrade reference: [Capacitor 8 updating guide](https://capacitorjs.com/docs/updating/8-0) (camera, geolocation, splash-screen, status-bar may have breaking changes).
