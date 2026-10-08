import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeApp } from './platform.js';
import { initNativeAuthStorage } from './nativeAuthStorage.js';
import { initNativeDeepLinks } from './nativeDeepLink.js';
import { initFileInputPermissionHooks } from './nativePermissions.js';

export async function installNativeEnhancements() {
  if (!isNativeApp()) return;

  document.documentElement.classList.add('capacitor-native');

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch {
    /* optional on some devices */
  }

  await initNativeAuthStorage();
  initNativeDeepLinks();
  initFileInputPermissionHooks();

  if (Capacitor.getPlatform() === 'ios') {
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.setScroll({ isDisabled: false });
    } catch {
      /* optional */
    }
  }
}
