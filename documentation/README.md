# Saffo People — Frontend Documentation

Onboarding guide for the **Saffo People** HRMS web app and Android shell (`com.saffo.hrms`).

**Project root:** `React/web-app`  
**Product name:** Saffo People  
**Android applicationId:** `com.saffo.hrms`  
**Production API:** `https://solviotec.com`  
**Mobile shell:** Capacitor **8** · Android `versionCode` **3** / `versionName` **1.0.0** · minSdk **24** · targetSdk **36**

Also see [RELEASE_NOTES.md](./RELEASE_NOTES.md) for Play Store / changelog text.

---

## Who this is for

New engineers joining the frontend / Capacitor mobile track. Backend APIs are owned separately; this docs set describes the **React client**, routes, module APIs as called from the UI, and the **Android native** wrap.

---

## Start here

| Doc | Purpose |
|-----|---------|
| [TECH_STACK.md](./TECH_STACK.md) | Stack, env files, repo layout |
| [COMMANDS.md](./COMMANDS.md) | Dev, build, sync, APK/AAB commands |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Routing, auth gate, API shim, providers |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | Changelog + Play Store release text |

### Modules

| Doc | Area |
|-----|------|
| [modules/01-auth-login.md](./modules/01-auth-login.md) | OTP login, token, session |
| [modules/02-dashboard.md](./modules/02-dashboard.md) | Home, punch-in/out, location |
| [modules/03-attendance.md](./modules/03-attendance.md) | Calendar & Excel download |
| [modules/04-leaves.md](./modules/04-leaves.md) | Leave balance, apply, cancel, comp-off |
| [modules/05-wfh.md](./modules/05-wfh.md) | Work-from-home requests |
| [modules/06-queries.md](./modules/06-queries.md) | Apply Query, chat, attachments |
| [modules/07-profile.md](./modules/07-profile.md) | Employee profile & documents |
| [modules/08-payslip-tax.md](./modules/08-payslip-tax.md) | Payslip, Form 16, tax projection |
| [modules/09-it-assets.md](./modules/09-it-assets.md) | IT panel, assets, tickets |
| [modules/10-manager.md](./modules/10-manager.md) | Manager approvals & team |
| [modules/11-hr.md](./modules/11-hr.md) | HR console |
| [modules/12-admin-accounts.md](./modules/12-admin-accounts.md) | Admin hub & accounts |
| [modules/13-claims-holiday-misc.md](./modules/13-claims-holiday-misc.md) | Claims, holidays, performance, separation |

### Native Android

| Doc | Purpose |
|-----|---------|
| [native/android-capacitor.md](./native/android-capacitor.md) | Capacitor setup, mobile quirks, release builds |

---

## Quick mental model

```
Browser / WebView
    → React 19 + Vite + React Router
    → fetch("/api/...") 
         · Web: Vite proxy / same-origin
         · Native: mobileApiShim → CapacitorHttp → https://solviotec.com
    → Backend (Solvio / solviotec.com)
```

Auth: JWT in `localStorage` (`token`), sent as `Authorization: Bearer <token>`.

On Android, sensitive screens are protected with `FLAG_SECURE` (no screenshots). My Assets is native-only; Settings is hidden from the logo dropdown on native.
