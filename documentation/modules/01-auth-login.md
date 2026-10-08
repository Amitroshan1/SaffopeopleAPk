# Module: Auth & login

**Primary files:** `src/pages/HeroSection.jsx`, `src/pages/HomePage.jsx`, user context under `src/context/`

## Purpose

Email OTP login for employees. No password on the primary mobile/web login path described here.

## User flow

1. User enters **email** (identifier).
2. App calls request-OTP.
3. User enters OTP.
4. App verifies OTP, stores JWT, loads user, navigates to `/dashboard`.

## APIs

### Request OTP

`POST /api/auth/request-otp`

```json
{ "identifier": "user@company.com" }
```

Success: `{ success: true, message, resend_after? }`  
Rate limit may return `retry_after`.

### Verify OTP

`POST /api/auth/verify-otp`

```json
{ "identifier": "user@company.com", "otp": "123456" }
```

Success: `{ success: true, token, plan?, features? }`

Client then:

- `localStorage.setItem("token", data.token)`
- `localStorage.setItem("lastActivityAt", ...)`
- `setPlanContext(plan, features)`
- `refreshUserData()`
- `navigate("/dashboard", { replace: true })`

## UI notes

- Version label **Version 1.0.0** under login (keep in sync with Android `versionName`).
- If `token` already exists, Hero login UI returns `null` (session present).

## Related

- Change password: `/change-password` (HR API) — separate from OTP login.
- Native: token also mirrored via Capacitor Preferences (`nativeAuthStorage.js`).
