# Native iOS — Capacitor 8 + TestFlight

Guide for building **Saffo People** on iOS, uploading to **App Store Connect**, distributing via **TestFlight**, and later releasing to the **App Store** (production).

> **Note:** iOS uses an **IPA / App Store build**, not an Android **APK**. APK/AAB is Play Store only.

---

## Identity

| Field | Value |
|-------|--------|
| Bundle ID / appId | `com.saffo.hrms` |
| App name | Saffo People |
| webDir | `dist` |
| Config | `capacitor.config.json` |
| iOS project | `ios/App/App.xcodeproj` |
| Capacitor | **8.x** (`@capacitor/ios`, plugins via CapApp-SPM) |
| Min iOS | **15.0** |
| Marketing version | `1.0` (`MARKETING_VERSION`) |
| Build number | `1` (`CURRENT_PROJECT_VERSION`) — **bump on every upload** |

Env for mobile web assets: `.env.mobile` → `VITE_API_ORIGIN=https://solviotec.com`.

---

## What you need before TestFlight

| Requirement | Purpose |
|-------------|---------|
| **Mac** + **Xcode** | Archive and upload |
| **Paid Apple Developer Program** | Required for App Store Connect + TestFlight (~yearly fee) |
| Active membership (not “Enrollment pending”) | Upload is blocked until Apple activates the account |
| Apple ID signed into Xcode + iCloud on that Mac | Signing and enrollment |
| Bundle ID registered / app created in App Store Connect | Must match `com.saffo.hrms` |

### Membership status

- Check: [developer.apple.com/account](https://developer.apple.com/account) → **Membership details**
- Or: **Apple Developer** app → **Account**
- **Enrollment pending** = paid/submitted; wait for Apple email (often hours, up to 1–2 days). Do **not** pay again.
- When active: Team ID, renewal date, and App Store Connect access appear.

### Apple ID vs Developer Program

Creating an Apple ID (e.g. with Gmail) is **free** and is **not** enough for TestFlight.  
You must complete **Apple Developer Program** enrollment + payment. TestFlight is **included** — there is no separate TestFlight fee.

### ID verification (Individual enrollment)

Apple may reject ID verification if:

- Apple Account **name** ≠ name on government ID (use legal name, not a brand like “Saffo tech”)
- DOB / country mismatch
- Blurry ID or selfie

Prefer enrolling on **iPhone** with a clear **passport** (or accepted local ID). After multiple rejects, wait 24–48 hours or contact [Apple Developer support](https://developer.apple.com/contact/).

---

## IPA vs APK (do not confuse)

| Platform | Artifact | Where testers get it |
|----------|----------|----------------------|
| **Android** | APK / AAB | Play Console testing, or sideload APK |
| **iOS** | Xcode archive → App Store build | **TestFlight** app only (for beta) |

Testers do **not** install a raw “iOS APK”. They use the **TestFlight** app from the App Store.

---

## Build pipeline (every upload)

Run from the project root (this repo):

### 1) Build web assets for Capacitor

```bash
npm run build:mobile
```

Uses Vite `--mode mobile` → `.env.mobile`. Output: `dist/`.

### 2) Sync into iOS project

```bash
npx cap sync ios
```

Copies `dist/` into the iOS app (public assets are gitignored; sync regenerates them).

### 3) Open Xcode

```bash
npx cap open ios
```

Or open: `ios/App/App.xcodeproj`.

### 4) Signing in Xcode

1. Select target **App**
2. **Signing & Capabilities**
3. Team = your **paid** Apple Developer team
4. Bundle Identifier = `com.saffo.hrms`
5. Automatically manage signing (typical)

Bump versions before each TestFlight/App Store upload:

- **Version** (`MARKETING_VERSION`) — user-facing, e.g. `1.0.0`
- **Build** (`CURRENT_PROJECT_VERSION`) — must **increase** every upload (1 → 2 → 3…)

### 5) Archive and upload

1. Device destination: **Any iOS Device (arm64)** (not a simulator)
2. **Product → Archive**
3. Organizer → **Distribute App**
4. **App Store Connect** → Upload
5. Wait for email: build finished **Processing** (often 5–30+ minutes)

---

## App Store Connect — create the app (first time)

1. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Apps** → **+** → New App
3. Platform: **iOS**
4. Name: **Saffo People** (or approved listing name)
5. Bundle ID: **`com.saffo.hrms`** (must match Xcode)
6. SKU: any unique string (e.g. `saffo-people-ios`)
7. Save

If Bundle ID is missing, create it under [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → Identifiers → App IDs → `com.saffo.hrms`.

---

## TestFlight (testing / beta)

### What testers need

| Item | Required for TestFlight? |
|------|---------------------------|
| App icon (in Xcode assets) | **Yes** (project already includes icon assets) |
| App Store screenshots | **No** |
| Full store description / promo art | **No** |
| Invited Apple ID / email | **Yes** |
| **TestFlight** app installed on iPhone | **Yes** |

Screenshots and store listing graphics are for **App Store production**, not for TestFlight.

### Where the “live for testers” build lives

1. You upload from **Xcode** → **App Store Connect**
2. Open app → **TestFlight** tab
3. Complete compliance questions if asked (e.g. export compliance / encryption)
4. Add **Internal** testers (App Store Connect users on your team) — fastest
5. Or **External** testers (email invites) — first external group needs **Beta App Review** once

Testers:

1. Install **TestFlight** from the App Store  
2. Accept invite (email / public link)  
3. Install **Saffo People** from TestFlight  
4. When you upload a **new build** (higher build number), they open TestFlight → **Update**

### Internal vs external

| Type | Who | Review |
|------|-----|--------|
| Internal | Users on your App Store Connect team (up to 100) | Usually no Beta App Review |
| External | Outside emails (up to 10,000) | Beta App Review for first build in a group |

There is **no** Apple rule of “12 testers for 14 days” (that is a **Google Play** closed-testing rule for some accounts).

### Uploading another build for testers

```bash
npm run build:mobile
npx cap sync ios
# Xcode: bump Build number → Archive → Upload
```

Testers see the new build in TestFlight after processing. Same app, new build number.

---

## Splash screen

iOS launch splash uses `ios/App/App/Assets.xcassets/Splash.imageset/` (shown by `LaunchScreen.storyboard`).

It is generated from the Android portrait splash  
`android/app/src/main/res/drawable-port-xxxhdpi/splash.png` (blue→teal **S** brand), scaled to 2732×2732 for the imageset slots.

To refresh after changing the Android splash: replace those Splash.imageset PNGs (or re-export from the Android xxxhdpi asset) and rebuild in Xcode.

App icon remains separate: `AppIcon.appiconset/` — not the splash.

---

## Privacy strings (Info.plist)

Already present under `ios/App/App/Info.plist` — required for location/camera/photos prompts:

- `NSLocationWhenInUseUsageDescription` — attendance / office verification  
- `NSCameraUsageDescription` — HRMS photo capture  
- `NSPhotoLibraryUsageDescription` — uploads / attachments  

Do not remove these before release.

---

## iOS-specific app behavior (this project)

| Feature | Behavior |
|---------|----------|
| System Location Services off | Fullscreen gate (`LocationServicesGate` + native `LocationServices` plugin) |
| Punch GPS reliability | iOS path: coarse-then-accurate retries; keep last good fix on refresh failure |
| Keyboard | Bottom nav hides while keyboard is open (iOS) |
| Screenshot lock | Android has `FLAG_SECURE`; iOS does **not** (unless you add it later) |

Shared React UI and Capacitor plugins are the same shell as Android; native differences are above.

Debug on a physical iPhone (USB or paired device):

```bash
npm run build:mobile
npx cap sync ios
# Xcode: select device → Run
# or: xcodebuild … then devicectl install/launch
```

---

## When to leave TestFlight and go production (App Store)

**TestFlight** = invited testers only.  
**App Store** = public / production install.

Go live when:

- Login, punch, location, and critical flows work on real devices  
- API points at production (`.env.mobile` / `VITE_API_ORIGIN`)  
- You are ready with store listing: description, **screenshots**, privacy policy URL, support URL, age rating, etc.

### Production submit

1. App Store Connect → your app → **App Store** tab  
2. Complete listing metadata + screenshots  
3. Select a processed build (same pipeline as TestFlight)  
4. **Add for Review** / **Submit for Review**  
5. Wait for Apple review (often 24–48 hours; can vary)  
6. Status **Ready for Sale** → live in production  

Submitting to TestFlight does **not** automatically publish to the App Store. Production is a separate submit.

You can keep using TestFlight for future betas after the app is live.

---

## Checklist — first TestFlight release

- [ ] Apple Developer membership **Active** (not pending)  
- [ ] App created in App Store Connect with bundle `com.saffo.hrms`  
- [ ] Xcode Team = paid team; signing succeeds  
- [ ] `npm run build:mobile` + `npx cap sync ios`  
- [ ] Version / Build set; Build unique for this upload  
- [ ] Archive → Upload → Processing complete  
- [ ] TestFlight compliance answers done  
- [ ] At least one internal/external tester invited  
- [ ] Tester installs via **TestFlight** app and can open Saffo People  

---

## Checklist — App Store (production)

- [ ] Stable TestFlight build signed off  
- [ ] Screenshots for required device sizes  
- [ ] Privacy policy + support URLs  
- [ ] App Privacy / questionnaire completed  
- [ ] Submit for Review → approved → Ready for Sale  

---

## Useful links

| Resource | URL |
|----------|-----|
| Apple Account | https://appleid.apple.com |
| Enroll / membership | https://developer.apple.com/programs/enroll/ |
| Developer account | https://developer.apple.com/account |
| App Store Connect | https://appstoreconnect.apple.com |
| TestFlight (Apple) | https://developer.apple.com/testflight/ |
| Contact Apple | https://developer.apple.com/contact/ |

---

## Related docs

- [android-capacitor.md](./android-capacitor.md) — Android Capacitor shell & Play builds  
- [../COMMANDS.md](../COMMANDS.md) — command cheat sheet  
- [../modules/02-dashboard.md](../modules/02-dashboard.md) — punch / location behavior  
