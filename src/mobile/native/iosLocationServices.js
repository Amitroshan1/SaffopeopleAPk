import { registerPlugin, Capacitor } from '@capacitor/core';

const LocationServices = registerPlugin('LocationServices');

export async function isSystemLocationEnabled() {
  if (Capacitor.getPlatform() !== 'ios') {
    return true;
  }

  const result = await LocationServices.isLocationEnabled();
  return result.enabled === true;
}

/** Opens this app's Settings page (public iOS API; cannot deep-link to system Location Services). */
export async function openAppSettings() {
  await LocationServices.openAppSettings();
}
