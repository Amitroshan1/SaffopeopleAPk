import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativeApp } from './platform.js';

const CATALOG_PREFIX = 'app_downloads_user_';
export const DOWNLOAD_USER_KEY = 'app_download_user_id';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      resolve(dataUrl.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadViaAnchor(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

function safeFileName(filename) {
  return (filename || 'download').replace(/[/\\?%*:|"<>]/g, '_');
}

function catalogKey(userId) {
  return `${CATALOG_PREFIX}${userId || 'anonymous'}`;
}

function readCatalog(userId) {
  try {
    const raw = localStorage.getItem(catalogKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCatalog(userId, items) {
  try {
    localStorage.setItem(catalogKey(userId), JSON.stringify(items.slice(0, 200)));
  } catch {
    // ignore quota / private mode
  }
}

function decodeUserIdFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const part = token.split('.')[1];
    if (!part) return '';
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return String(
      payload.admin_id
      || payload.user_id
      || payload.id
      || payload.sub
      || payload.uid
      || ''
    );
  } catch {
    return '';
  }
}

export function resolveDownloadUserId(explicitUserId) {
  if (explicitUserId != null && String(explicitUserId).trim()) {
    return String(explicitUserId).trim();
  }
  try {
    const stored = localStorage.getItem(DOWNLOAD_USER_KEY);
    if (stored) return stored;
  } catch {
    // ignore
  }
  return decodeUserIdFromToken() || 'anonymous';
}

export function setDownloadUserId(userId) {
  if (userId == null || userId === '') return;
  try {
    localStorage.setItem(DOWNLOAD_USER_KEY, String(userId));
  } catch {
    // ignore
  }
}

function makeEntry({ userId, fileName, mimeType, size, uri, path, method, source }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId: String(userId),
    fileName,
    mimeType: mimeType || '',
    size: typeof size === 'number' ? size : null,
    uri: uri || null,
    path: path || null,
    method: method || 'web',
    source: source || '',
    downloadedAt: new Date().toISOString(),
  };
}

function recordDownload(entry) {
  const list = readCatalog(entry.userId);
  writeCatalog(entry.userId, [entry, ...list]);
  return entry;
}

/**
 * List downloads for one user only (never mixes users).
 */
export function listUserDownloads(userId) {
  const uid = resolveDownloadUserId(userId);
  return readCatalog(uid);
}

/**
 * Remove one download record (and native file when possible).
 */
export async function removeUserDownload(userId, downloadId) {
  const uid = resolveDownloadUserId(userId);
  const list = readCatalog(uid);
  const item = list.find((d) => d.id === downloadId);
  const next = list.filter((d) => d.id !== downloadId);
  writeCatalog(uid, next);

  if (item?.path && isNativeApp()) {
    try {
      await Filesystem.deleteFile({
        path: item.path,
        directory: Directory.Data,
      });
    } catch {
      // file may already be gone
    }
  }

  return next;
}

/**
 * Clear all download records for one user (optional file wipe).
 */
export async function clearUserDownloads(userId, { deleteFiles = false } = {}) {
  const uid = resolveDownloadUserId(userId);
  const list = readCatalog(uid);

  if (deleteFiles && isNativeApp()) {
    await Promise.all(
      list.map(async (item) => {
        if (!item.path) return;
        try {
          await Filesystem.deleteFile({
            path: item.path,
            directory: Directory.Data,
          });
        } catch {
          // ignore
        }
      })
    );
  }

  writeCatalog(uid, []);
  return [];
}

/**
 * Open a previously saved native download in the system file viewer.
 * Does not use the Share sheet.
 */
export async function openUserDownload(item) {
  if (!item) throw new Error('File not found');
  if (!isNativeApp() || (!item.uri && !item.path)) {
    throw new Error('This file is not available for opening on this device.');
  }
  const { openNativeFile } = await import('./fileOpen.js');
  await openNativeFile({
    path: item.path,
    uri: item.uri,
    mimeType: item.mimeType,
    fileName: item.fileName,
  });
  return { method: 'native' };
}

/**
 * Share a previously saved native download (Share sheet).
 */
export async function shareUserDownload(item) {
  if (!item) throw new Error('File not found');

  if (item.uri && isNativeApp()) {
    await Share.share({
      title: item.fileName,
      url: item.uri,
      dialogTitle: 'Share file',
    });
    return { method: 'native' };
  }

  throw new Error('This file is not available for sharing on this device.');
}

/**
 * Saves a downloaded file using native Filesystem + Share sheet on mobile.
 * Web keeps anchor-download behavior.
 * Always records a per-user catalog entry for My Downloads.
 *
 * @param {Blob} blob
 * @param {string} filename
 * @param {{ userId?: string|number, source?: string, skipShare?: boolean }} [options]
 */
export async function saveBlobAsFile(blob, filename, options = {}) {
  const safeName = safeFileName(filename);
  const userId = resolveDownloadUserId(options.userId);
  const source = options.source || '';
  const mimeType = blob?.type || '';
  const size = typeof blob?.size === 'number' ? blob.size : null;

  if (!isNativeApp()) {
    downloadViaAnchor(blob, safeName);
    const entry = recordDownload(
      makeEntry({
        userId,
        fileName: safeName,
        mimeType,
        size,
        method: 'web',
        source,
      })
    );
    return { method: 'web', entry };
  }

  const relativePath = `downloads/${userId}/${Date.now()}_${safeName}`;
  const base64 = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: relativePath,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  });

  const entry = recordDownload(
    makeEntry({
      userId,
      fileName: safeName,
      mimeType,
      size,
      uri: written.uri,
      path: relativePath,
      method: 'native',
      source,
    })
  );

  if (!options.skipShare) {
    try {
      await Share.share({
        title: safeName,
        url: written.uri,
        dialogTitle: 'Save or open file',
      });
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('cancel')) {
        return { method: 'native', uri: written.uri, cancelled: true, entry };
      }
      throw e;
    }
  }

  return { method: 'native', uri: written.uri, entry };
}
