import { useCallback, useState } from 'react';
import { saveBlobAsFile } from '../mobile/native/nativeDownload';

const ACCOUNTS_FILE_BASE = '/api/accounts/file';

export function buildProtectedFileUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const normalized = String(filePath).replace(/^\/+/, '').replace(/^static\/uploads\//, '');
  return `${ACCOUNTS_FILE_BASE}/${normalized}`;
}

export function looksLikeImageFile(filePath, blob) {
  if (blob?.type && String(blob.type).toLowerCase().startsWith('image/')) return true;
  const ext = String(filePath || '').split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
}

/**
 * Shared protected file open: images → in-app preview; other files → download.
 */
export function useProtectedFileViewer() {
  const [imagePreview, setImagePreview] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null);

  const closeImagePreview = useCallback(() => {
    setImagePreview((prev) => {
      if (prev?.url) window.URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const openProtectedFile = useCallback(async (filePath, options = {}) => {
    const url = buildProtectedFileUrl(filePath);
    if (!url) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please login again.');
      return;
    }
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = 'Unable to open file';
        try {
          const j = await res.json();
          msg = j?.message || j?.msg || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const fileName = options.fileName || String(filePath).split('/').pop() || 'attachment';
      if (looksLikeImageFile(filePath, blob)) {
        const blobUrl = window.URL.createObjectURL(blob);
        setImagePreview((prev) => {
          if (prev?.url) window.URL.revokeObjectURL(prev.url);
          return { url: blobUrl, fileName };
        });
        return { kind: 'image' };
      }
      await saveBlobAsFile(blob, fileName, { source: options.source || 'employee-360' });
      return { kind: 'download' };
    } catch (e) {
      alert(e.message || 'Unable to open file');
      return null;
    }
  }, []);

  const handleViewFileWithLoading = useCallback(async (filePath, key, options = {}) => {
    if (!filePath) return;
    setLoadingKey(key);
    try {
      await openProtectedFile(filePath, options);
    } finally {
      setLoadingKey(null);
    }
  }, [openProtectedFile]);

  return {
    imagePreview,
    closeImagePreview,
    openProtectedFile,
    handleViewFileWithLoading,
    loadingKey,
  };
}

export function ProtectedImagePreviewOverlay({ preview, onClose }) {
  if (!preview) return null;
  return (
    <div className="hr-image-preview-overlay" onClick={onClose} role="presentation">
      <div className="hr-image-preview-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hr-image-preview-header">
          <span className="hr-image-preview-name" title={preview.fileName}>
            {preview.fileName}
          </span>
          <button type="button" className="hr-image-preview-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="hr-image-preview-body">
          <img src={preview.url} alt={preview.fileName || 'Preview'} />
        </div>
      </div>
    </div>
  );
}
