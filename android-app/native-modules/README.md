# Android Native Modules

Capacitor plugins wrap Android native APIs. Custom Java/Kotlin modules are **not** required for v1.

| Module | Plugin | Why native (not WebView-only) |
|--------|--------|-------------------------------|
| GPS / punch | `@capacitor/geolocation` | Reliable permission prompts & high-accuracy GPS on Android 10+ |
| Auth token | `@capacitor/preferences` | OS-backed storage; survives WebView cache clears better than localStorage alone |
| File download | `@capacitor/filesystem` + `@capacitor/share` | Anchor downloads fail on many WebViews; share sheet opens PDF/Excel in viewer |
| Deep links | `@capacitor/app` | `intent-filter` URLs → SPA routes |
| Splash / status bar | `@capacitor/splash-screen`, `@capacitor/status-bar` | Native chrome |
| Camera (assessment) | WebView `getUserMedia` + `CAMERA` permission | Full proctoring needs stream; native Camera plugin optional for still capture |

Implementation: `web-app/src/mobile/native/*.js` — synced into APK via `web-app/dist`.
