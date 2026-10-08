import { App } from '@capacitor/app';
import { isNativeApp } from './platform.js';

function pathFromUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
  } catch {
    return '/';
  }
}

function navigateToPath(path) {
  const target = path && path.startsWith('/') ? path : `/${path || ''}`;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Handles solviotec:// and https://solviotec.com deep links in the native shell.
 * Hardware back is handled by NativeBackHandler (React Router navigate(-1)).
 */
export function initNativeDeepLinks() {
  if (!isNativeApp()) return;

  App.addListener('appUrlOpen', (event) => {
    if (!event?.url) return;
    navigateToPath(pathFromUrl(event.url));
  });

  App.getLaunchUrl().then((result) => {
    if (result?.url) {
      navigateToPath(pathFromUrl(result.url));
    }
  });
}
