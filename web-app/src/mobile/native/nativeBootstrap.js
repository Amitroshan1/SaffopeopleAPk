import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeApp } from './platform.js';
import { initNativeAuthStorage } from './nativeAuthStorage.js';
import { initNativeDeepLinks } from './nativeDeepLink.js';
import { initFileInputPermissionHooks } from './nativePermissions.js';

export async function installNativeEnhancements() {
  if (!isNativeApp()) return;

  document.documentElement.classList.add('capacitor-native');

  await initNativeAuthStorage();
  initNativeDeepLinks();
  initFileInputPermissionHooks();

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#f4f7f6' });
  } catch {
    /* optional on some devices */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* already hidden */
  }

  if (Capacitor.getPlatform() === 'ios') {
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.setScroll({ isDisabled: false });
    } catch {
      /* optional */
    }
  }
}
