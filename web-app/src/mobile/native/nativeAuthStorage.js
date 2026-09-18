import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './platform.js';

const SYNC_KEYS = ['token', 'lastActivityAt', 'sessionExpired'];

let patched = false;

/**
 * Persists auth/session keys in native Preferences (encrypted OS storage on device)
 * while keeping localStorage in sync for existing app code.
 */
export async function initNativeAuthStorage() {
  if (!isNativeApp() || patched) return;

  for (const key of SYNC_KEYS) {
    const { value } = await Preferences.get({ key });
    if (value != null && value !== '') {
      localStorage.setItem(key, value);
    }
  }

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    if (SYNC_KEYS.includes(key)) {
      Preferences.set({ key, value: String(value) }).catch(() => {});
    }
  };

  localStorage.removeItem = (key) => {
    originalRemoveItem(key);
    if (SYNC_KEYS.includes(key)) {
      Preferences.remove({ key }).catch(() => {});
    }
  };

  patched = true;
}

export async function clearNativeAuthStorage() {
  if (!isNativeApp()) return;
  await Promise.all(SYNC_KEYS.map((key) => Preferences.remove({ key })));
}
