# Native Android (Capacitor 8)

## Identity

| Field | Value |
|-------|--------|
| appId | `com.saffo.hrms` |
| appName | Saffo People |
| webDir | `dist` |
| Config | `capacitor.config.json` |
| Android project | `web-app/android` |
| Capacitor | **8.x** (`@capacitor/core` / `android` / `cli`) |

## SDK & versioning

From `android/variables.gradle` and `android/app/build.gradle`:

| Setting | Value |
|---------|--------|
| `minSdkVersion` | **24** |
| `compileSdkVersion` | **36** |
| `targetSdkVersion` | **36** |
| `versionCode` | **3** |
| `versionName` | **"1.0.0"** |
| AGP | **8.13.0** |
| Gradle wrapper | **8.14.3** |
| JDK | **21+** required |

Bump `versionCode` on every Play upload. Keep login UI **Version** text in sync with `versionName`.

## Build modes

| Goal | Command sequence |
|------|------------------|
| Debug install | `npm run build:mobile` → `npx cap sync android` → `gradlew installDebug` |
| Share APK | Copy `app-debug.apk` to e.g. `C:\Users\pc\Downloads\Saffo-People.apk` |
| Play Store | Signed **AAB** via Android Studio + keystore |

Env for mobile web assets: `.env.mobile` → `VITE_API_ORIGIN=https://solviotec.com`.

## JS native layer (`src/mobile/`)

| File | Role |
|------|------|
| `mobileApiShim.js` | Absolute API origin, CapacitorHttp, FormData, binary blobs |
| `native/nativeBootstrap.js` | Status bar, class `capacitor-native`, auth/deeplink/permissions |
| `native/platform.js` | `isNativeApp()` |
| `native/nativeAuthStorage.js` | Preferences ↔ localStorage bridge |
| `native/nativeLocation.js` | Geolocation for punch |
| `native/nativeDownload.js` | Filesystem + Share |
| `native/NativeBackHandler.jsx` | Android back stack |
| `native/nativeDeepLink.js` | `solviotec://` / https deep links |
| `native/nativePermissions.js` | Camera / files / location prompts |

## Product constraints (do not regress)

1. **FLAG_SECURE** stays enabled for sensitive activity — screenshots appear black; that is intentional.
2. **My Assets** is native-focused.
3. Phone header ~**72px**.
4. **Settings** hidden from logo dropdown on native.
5. Login shows **Version** matching `versionName` in `android/app/build.gradle`.
6. Splash / launcher: mipmaps + `ic_launcher_background` under `android/app/src/main/res/`.

## Signing & release

- Keystore example path: `C:\Users\pc\AndroidKeys\saffo-people.jks`
- Create/use keystore in Android Studio; keep passwords out of git / `build.gradle`
- After icon/splash or SDK changes: `gradlew clean` then rebuild
- Plugin breaking changes after Cap 8: camera, geolocation, splash-screen, status-bar — see https://capacitorjs.com/docs/updating/8-0#plugins

## Debugging checklist

1. `adb devices` — device authorized  
2. Confirm `build:mobile` picked `.env.mobile` (API host correct)  
3. Query create fails with missing fields → FormData / shim regression  
4. Attachment open fails → `/files/` binary handling  
5. Punch fails → location permission + `location-check`  
6. “UI shifted / black capture” → FLAG_SECURE, not layout  
7. Gradle / sync fails → verify **JDK 21** is selected in Android Studio  

## Useful Android Studio actions

- **File → Sync Project with Gradle Files**
- **Build → Clean Project** then **Rebuild**
- **Run** on physical device
- **Build → Generate Signed Bundle / APK** for release
