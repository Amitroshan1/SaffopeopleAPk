# Saffo People — Release Notes

## Version 1.0.0 (versionCode 3)

**App name:** Saffo People  
**Package:** `com.saffo.hrms`  
**versionName:** `1.0.0`  
**versionCode:** `3`  
**Platform:** Android (Capacitor **8**)  
**API:** Production — `https://solviotec.com`

### Requirements

| Item | Value |
|------|--------|
| Minimum Android | 7.0 (API **24**) |
| Target / Compile SDK | API **36** |
| JDK (build) | **21+** |
| Permissions | Location (punch), camera/files (attachments), storage/share (downloads) |

---

### What’s new / included

#### Login & session
- Email OTP login
- Secure session handling on device
- App version shown on the login screen (`Version 1.0.0`)

#### Employee home
- Dashboard with punch-in / punch-out and location check
- **Apply Query** shortcut on home
- Holiday Calendar available from the profile/logo menu
- Settings entry hidden on the native app menu

#### Core HR modules
- Attendance calendar and summary; Excel download
- Leave balance, apply, cancel, and Comp-Off ledger
- Work From Home (WFH) requests
- Claims, separation, performance (as enabled for the employee)
- Profile, documents, and photo upload
- Payslip, Form 16, and tax-related screens (sensitive data protected)

#### Apply Query
- Create queries with title, department, description, and attachments
- Chat replies, mark-read, and close
- In-app preview for images; open/download for other files
- Reliable native submit (FormData) and attachment download (`/files/`)

#### Native Android experience
- Capacitor **8** shell (upgraded from 7)
- Branded splash and launcher icon
- Status bar styling for the Capacitor shell
- Screen capture protection (`FLAG_SECURE`) on sensitive surfaces
- Mobile-tuned header height
- File download / share sheet support
- Deep-link readiness for Solvio / solviotec hosts
- **My Assets** available as the native assets surface

#### Manager / HR / IT / Admin
- Role-based areas for manager approvals, HR console, IT assets/tickets, and admin (same product as web; visibility depends on role)

---

### Google Play — short release notes (copy/paste)

```
Saffo People 1.0.0

• Secure email OTP login
• Punch in/out with location
• Attendance, leave, WFH & claims
• Apply Query with chat & attachments
• Payslip, Form 16 & profile
• Holiday calendar
• Android 7.0+ (API 24)
```

---

### Known notes

- Debug / share APKs are for internal testing; Play Store distribution requires a signed release AAB/APK.
- Screenshots may appear black on protected screens — intentional security behaviour.
- Large web bundle; first load may take a moment on slower devices.
- Build with JDK 21+ after the Capacitor 8 migration.

---

### Build / distribute (internal)

Share debug APK path used for testing:

`C:\Users\pc\Downloads\Saffo-People.apk`

Release signing: use Android Studio with the project keystore (do not commit keystore passwords).
