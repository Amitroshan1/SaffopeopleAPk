# Android Release Signing

## Create keystore (one-time)

```powershell
keytool -genkey -v -keystore release/solviotec-release.keystore -alias solviotec -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore **outside git**. Add `release/*.keystore` to `.gitignore`.

## Configure Gradle

Copy `android/keystore.properties.example` to `android/keystore.properties`:

```properties
storeFile=../release/solviotec-release.keystore
storePassword=***
keyAlias=solviotec
keyPassword=***
```

## Build signed release

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
cd android-app/android
.\gradlew.bat bundleRelease
cd ..
node scripts/copy-release.cjs
```

Upload `release/solviotec-hrms-release.aab` to Play Console.

## Play App Signing

Enable **Google Play App Signing** on first upload. Google manages the app signing key; you use an upload key.
