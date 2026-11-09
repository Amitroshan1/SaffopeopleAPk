import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { isNativeApp } from '../native/platform.js';

/**
 * Play Immediate Update helpers (Android only).
 * Call getAppUpdateInfo() before performImmediateUpdate() or Play returns INFO_MISSING.
 */

export function canUsePlayInAppUpdate() {
  return isNativeApp() && Capacitor.getPlatform() === 'android';
}

/**
 * @returns {Promise<{ needsUpdate: boolean, info: object | null }>}
 */
export async function checkPlayForceUpdate() {
  if (!canUsePlayInAppUpdate()) {
    return { needsUpdate: false, info: null };
  }

  try {
    const info = await AppUpdate.getAppUpdateInfo();
    const available = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
    const needsUpdate = Boolean(available && info.immediateUpdateAllowed);
    return { needsUpdate, info };
  } catch (err) {
    console.warn('[forceUpdate] getAppUpdateInfo failed:', err);
    return { needsUpdate: false, info: null };
  }
}

/**
 * Starts Google Play Immediate Update. Must run after a successful getAppUpdateInfo().
 * @returns {Promise<{ ok: boolean, code?: number, error?: unknown }>}
 */
export async function startImmediateUpdate() {
  if (!canUsePlayInAppUpdate()) {
    return { ok: false, error: 'not_android' };
  }

  try {
    // Required again before performImmediateUpdate (plugin docs).
    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      return { ok: false, code: info.updateAvailability, error: 'not_available' };
    }
    if (!info.immediateUpdateAllowed) {
      return { ok: false, error: 'not_allowed' };
    }
    const result = await AppUpdate.performImmediateUpdate();
    return { ok: result?.code === 0, code: result?.code };
  } catch (err) {
    console.warn('[forceUpdate] performImmediateUpdate failed:', err);
    return { ok: false, error: err };
  }
}
