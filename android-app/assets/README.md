# Android Store Assets

Replace placeholder launcher icons before Play Store submission.

## Adaptive icon

Generate 512×512 master artwork, then use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) or `@capacitor/assets`:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android --iconBackgroundColor "#1e3a5f"
```

Output overwrites `android/app/src/main/res/mipmap-*`.

## Splash

Configured via `@capacitor/splash-screen` and `capacitor.config.ts` (`backgroundColor: #1e3a5f`).
