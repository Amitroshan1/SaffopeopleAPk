import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { isNativeApp } from './platform.js';
import { ensureLocationPermission } from './nativePermissions.js';

function getWebCoordinates(timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GEOLOCATION_UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_m: position.coords.accuracy ?? null,
          device_class: 'web',
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 }
    );
  });
}

function toCoords(position) {
  return {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    accuracy_m: position.coords.accuracy ?? null,
    device_class: Capacitor?.getPlatform?.() || 'android',
  };
}

async function getNativePositionOnce({ enableHighAccuracy, timeout, maximumAge }) {
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy,
    timeout,
    maximumAge,
  });
  return toCoords(position);
}

/**
 * iOS-only: coarse/fast first, then high accuracy, with retries.
 * Android keeps a single high-accuracy request (unchanged behavior).
 */
async function getIosCoordinates(timeoutMs) {
  const attempts = [
    { enableHighAccuracy: false, timeout: Math.min(8000, timeoutMs), maximumAge: 30000 },
    { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 },
    { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
  ];

  let lastError;
  for (const opts of attempts) {
    try {
      return await getNativePositionOnce(opts);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Location unavailable');
}

/**
 * Native GPS via Capacitor on Android/iOS; browser API on web.
 * Required for reliable punch in/out permissions on mobile WebView.
 */
export async function getCurrentCoordinates(options = {}) {
  const timeout = options.timeout ?? 20000;

  if (!isNativeApp()) {
    return getWebCoordinates(timeout);
  }

  const perm = await ensureLocationPermission();
  if (!perm.granted) {
    const err = new Error(perm.message || 'Location permission is required for attendance punch.');
    err.code = 1;
    throw err;
  }

  if (Capacitor.getPlatform() === 'ios') {
    return getIosCoordinates(timeout);
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout,
    maximumAge: 10000,
  });

  return toCoords(position);
}
