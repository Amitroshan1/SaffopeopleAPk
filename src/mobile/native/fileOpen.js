import { registerPlugin } from '@capacitor/core';
import { isNativeApp } from './platform';

const FileOpen = registerPlugin('FileOpen');

/**
 * Opens a saved native download with the system file viewer (ACTION_VIEW).
 * Does not show the Share sheet.
 */
export async function openNativeFile({ path, uri, mimeType, fileName } = {}) {
  if (!isNativeApp()) {
    throw new Error('Open is only available in the mobile app.');
  }
  if (!path && !uri) {
    throw new Error('This file is no longer available on this device.');
  }
  await FileOpen.open({
    path: path || '',
    uri: uri || '',
    mimeType: mimeType || '',
    fileName: fileName || '',
  });
}
