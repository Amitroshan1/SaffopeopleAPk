import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { isNativeApp } from './platform.js';

/**
 * Permission matrix (website → mobile). NOT requested at app launch.
 * - Internet / network: manifest only (no runtime prompt)
 * - Location: Dashboard punch (Geolocation)
 * - Camera + mic: Assessment proctoring (Camera + WebView getUserMedia)
 * - Photos: file inputs / gallery (Camera photos permission)
 * - Downloads: app cache + share (no extra permission Android 10+)
 * - In-app notifications API: HTTP polling only — NO push permission
 * - Bluetooth / biometrics / background: NOT used on website — NOT declared
 */

export async function ensureLocationPermission() {
  if (!isNativeApp()) return { granted: true };

  let status = await Geolocation.checkPermissions();
  const allowed = (value) => value === 'granted' || value === 'limited';
  if (allowed(status.location) || allowed(status.coarseLocation)) return { granted: true };

  status = await Geolocation.requestPermissions();
  if (allowed(status.location) || allowed(status.coarseLocation)) return { granted: true };

  return {
    granted: false,
    message: 'Location permission is required for punch in and punch out.',
  };
}

export async function ensureCameraPermission() {
  if (!isNativeApp()) return { granted: true };

  let status = await Camera.checkPermissions();
  if (status.camera === 'granted') return { granted: true };
  if (status.camera === 'denied') {
    return {
      granted: false,
      message: 'Camera is disabled. Enable it in Settings to continue the assessment.',
    };
  }

  status = await Camera.requestPermissions({ permissions: ['camera'] });
  if (status.camera === 'granted') return { granted: true };

  return {
    granted: false,
    message: 'Camera permission is required for assessment verification.',
  };
}

/** iOS/Android photo library for HR form attachments (not push notifications). */
export async function ensurePhotosPermission() {
  if (!isNativeApp()) return { granted: true };

  let status = await Camera.checkPermissions();
  if (status.photos === 'granted' || status.photos === 'limited') {
    return { granted: true };
  }
  if (status.photos === 'denied') {
    return {
      granted: false,
      message: 'Photo access is disabled. Enable it in Settings to attach files.',
    };
  }

  status = await Camera.requestPermissions({ permissions: ['photos'] });
  if (status.photos === 'granted' || status.photos === 'limited') {
    return { granted: true };
  }

  return {
    granted: false,
    message: 'Photo library access is needed to upload images and documents.',
  };
}

/**
 * Registers capture-phase handler so gallery permission is requested when user taps a file input.
 */
export function initFileInputPermissionHooks() {
  if (!isNativeApp() || initFileInputPermissionHooks._done) return;
  initFileInputPermissionHooks._done = true;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const input =
        target instanceof HTMLInputElement && target.type === 'file'
          ? target
          : target.closest?.('label')?.querySelector?.('input[type="file"]');
      if (input) {
        void ensurePhotosPermission();
      }
    },
    true
  );
}

initFileInputPermissionHooks._done = false;
