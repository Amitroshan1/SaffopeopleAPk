import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { profileFileContentUrl } from '../../utils/profileApi';
import {
    documentExtension,
    documentMimeType,
    extensionForMime,
    fetchDocumentBlob,
} from '../../utils/profileDocuments';
import { saveBlobAsFile } from '../../../../mobile/native/nativeDownload';
import { registerNativeBackHandler } from '../../../../mobile/native/nativeBackNavigation';

async function saveDocument({ blob, fileName, mimeType }) {
    const data = blob.type || !mimeType ? blob : new Blob([blob], { type: mimeType });
    const { method } = await saveBlobAsFile(data, fileName, { source: 'profile', skipShare: true });
    toast.success(method === 'native' ? `${fileName} saved to My Downloads` : `${fileName} downloaded`);
}

/**
 * Opens profile documents: images in a full-screen viewer, PDFs straight to My Downloads.
 */
export function useProfileDocumentOpener() {
    const [viewer, setViewer] = useState(null);
    const [busyKey, setBusyKey] = useState('');
    const busyRef = useRef(false);
    const viewerSrcRef = useRef('');

    const closeViewer = useCallback(() => {
        if (viewerSrcRef.current) URL.revokeObjectURL(viewerSrcRef.current);
        viewerSrcRef.current = '';
        setViewer(null);
    }, []);

    useEffect(() => () => {
        if (viewerSrcRef.current) URL.revokeObjectURL(viewerSrcRef.current);
    }, []);

    const openDocument = useCallback(async (key, path, baseName) => {
        if (busyRef.current) return;
        const url = profileFileContentUrl(path);
        if (!url) {
            toast.error('This document is not available.');
            return;
        }

        busyRef.current = true;
        setBusyKey(key);
        let ext = documentExtension(path);
        try {
            const blob = await fetchDocumentBlob(url);
            const blobType = String(blob.type || '').split(';')[0];
            const mimeType = (blobType && blobType !== 'application/octet-stream' ? blobType : '')
                || documentMimeType(ext);
            if (!ext) ext = extensionForMime(mimeType);

            if (ext !== 'pdf' && mimeType.startsWith('image/')) {
                const src = URL.createObjectURL(blob);
                viewerSrcRef.current = src;
                setViewer({
                    src,
                    blob,
                    mimeType,
                    fileName: `${baseName}.${ext || 'jpg'}`,
                });
            } else {
                await saveDocument({
                    blob,
                    mimeType: mimeType || 'application/pdf',
                    fileName: `${baseName}.${ext || 'pdf'}`,
                });
            }
        } catch {
            toast.error('Could not open the document. Please try again.');
        } finally {
            busyRef.current = false;
            setBusyKey('');
        }
    }, []);

    return { viewer, closeViewer, openDocument, busyKey };
}

export function DocumentImageViewer({ viewer, onClose }) {
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!viewer) return undefined;
        const unregister = registerNativeBackHandler(() => {
            onClose();
            return true;
        });
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            unregister();
            document.body.style.overflow = prevOverflow;
        };
    }, [viewer, onClose]);

    if (!viewer) return null;

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            await saveDocument({
                blob: viewer.blob,
                mimeType: viewer.mimeType,
                fileName: viewer.fileName,
            });
        } catch {
            toast.error('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return createPortal(
        <div className="doc-viewer-overlay" role="dialog" aria-modal="true" aria-label={viewer.fileName}>
            <div className="doc-viewer-bar">
                <p className="doc-viewer-title">{viewer.fileName}</p>
                <div className="doc-viewer-actions">
                    <button
                        type="button"
                        className="doc-viewer-btn doc-viewer-btn--download"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? 'Downloading…' : 'Download'}
                    </button>
                    <button
                        type="button"
                        className="doc-viewer-btn doc-viewer-btn--close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="doc-viewer-body" onClick={onClose}>
                <img src={viewer.src} alt={viewer.fileName} onClick={(e) => e.stopPropagation()} />
            </div>
        </div>,
        document.body
    );
}
