# Commands cheat sheet

Run all commands from `React/web-app` unless noted.

## Prerequisites

- Node.js (LTS; project tested on **v22**) + npm  
- Android Studio (for APK/AAB)  
- **JDK 21+** (required for Capacitor 8 / Android Gradle Plugin 8.13)  
- Optional: `adb` for device install  

Device example: `adb devices` → serial like `1ed9a1a7` (RMX5011).

Current Android versioning: `versionCode 3`, `versionName "1.0.0"` in `android/app/build.gradle`.

---

## Web (local)

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production web → dist/
npm run preview      # Preview dist/
npm run lint
```

---

## Mobile build pipeline

### 1) Build web assets for Capacitor

```bash
npm run build:mobile
```

Uses Vite `--mode mobile` → loads `.env.mobile` (`VITE_API_ORIGIN=https://solviotec.com`). Output: `dist/`.

### 2) Sync into Android project

```bash
npx cap sync android
```

Copies `dist/` into the Android assets and updates plugins.

### 3) Open in Android Studio

```bash
npx cap open android
```

Or open folder: `web-app/android`.

### 4) Debug APK (CLI)

```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

APK path:

`android\app\build\outputs\apk\debug\app-debug.apk`

Install + launch on device:

```powershell
cd android
.\gradlew.bat installDebug
adb -s <DEVICE_ID> shell am start -n com.saffo.hrms/.MainActivity
```

Or install an already-built APK:

```powershell
adb -s <DEVICE_ID> install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Shareable copy used historically:

```powershell
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk C:\Users\pc\Downloads\Saffo-People.apk -Force
```

### 5) Release APK / AAB (Android Studio)

Prefer **Build → Generate Signed Bundle / APK** in Android Studio with the existing keystore (`C:\Users\pc\AndroidKeys\saffo-people.jks`). Do not commit passwords.

CLI (only after signingConfigs are wired locally):

```powershell
cd android
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

Outputs under `android\app\build\outputs\apk\release\` or `...\bundle\release\`.

---

## Gradle tips (Windows)

If Gradle distribution download times out, point `GRADLE_USER_HOME` at your user `.gradle` folder and retry.

Clean when icons/splash or native resources look stale:

```powershell
cd android
.\gradlew.bat clean
```

Then rebuild / Run from Android Studio.

---

## Capacitor one-liners

```bash
npx cap sync android
npx cap copy android    # assets only, no dependency update
npx cap open android
```

---

## Typical “ship a test build” loop

```powershell
npm run build:mobile
npx cap sync android
cd android
.\gradlew.bat installDebug
adb shell am start -n com.saffo.hrms/.MainActivity
```

## Capacitor major upgrade (reference)

```bash
npm install @capacitor/cli@latest
npx cap migrate --noprompt --packagemanager npm
```

Then sync, clean, and retest on device. See [Capacitor 8 updating guide](https://capacitorjs.com/docs/updating/8-0).
