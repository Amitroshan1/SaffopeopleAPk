import React, { useEffect, useState, useRef } from 'react';
import { friendlyUploadName, profileFileContentUrl } from '../../utils/profileApi';

const IMAGE_EXT_PATTERN = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

function isImageFile(fileData) {
    if (!fileData) return false;
    if (typeof fileData === 'object') {
        if (fileData.type?.startsWith('image/')) return true;
        return IMAGE_EXT_PATTERN.test(fileData.name || '');
    }
    return IMAGE_EXT_PATTERN.test(String(fileData).split('?')[0]);
}

const ACCEPT_MIME = {
    pdf: ['application/pdf'],
    jpg: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    jpeg: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    png: ['image/png'],
};

async function fileMatchesAccept(file, accept) {
    const allowedExts = accept.replace(/\./g, '').toLowerCase().split(',').map((part) => part.trim()).filter(Boolean);
    const name = String(file.name || '');
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    if (ext && allowedExts.includes(ext)) return true;

    const mime = String(file.type || '').toLowerCase();
    if (allowedExts.some((item) => (ACCEPT_MIME[item] || []).includes(mime))) return true;

    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
    const isJpeg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    if (isPdf && allowedExts.includes('pdf')) return true;
    if (isJpeg && (allowedExts.includes('jpg') || allowedExts.includes('jpeg'))) return true;
    if (isPng && allowedExts.includes('png')) return true;
    return false;
}

export const FileUpload = ({ label, name, onFileChange, fileData, error, adminId, uploadProfileFileUrl, accept }) => {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [pickedName, setPickedName] = useState('');
    const [previewObjectUrl, setPreviewObjectUrl] = useState('');
    const inputRef = useRef(null);
    const localPreviewRef = useRef(false);

    const getDisplayName = () => {
        if (!fileData) return null;
        if (pickedName) return pickedName;
        if (typeof fileData === 'string') return friendlyUploadName(fileData, 'Certificate.pdf');
        return fileData.name || 'Certificate';
    };

    const handleActualFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPickedName(file.name || 'Certificate.pdf');
        const pickedIsImage = file.type?.startsWith('image/') || IMAGE_EXT_PATTERN.test(file.name || '');
        localPreviewRef.current = pickedIsImage;
        if (pickedIsImage) {
            setPreviewObjectUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return URL.createObjectURL(file);
            });
        } else {
            setPreviewObjectUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return '';
            });
        }

        if (accept && !(await fileMatchesAccept(file, accept))) {
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            localPreviewRef.current = false;
            setPickedName('');
            setPreviewObjectUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return '';
            });
            setUploadError(`Unsupported file format (.${ext || 'unknown'}). Please use .pdf, .jpg, .jpeg, or .png only.`);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        if (!adminId || !uploadProfileFileUrl) {
            setUploadError('Profile not loaded. Please refresh and try again.');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setProgress(10);
        setUploadError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('admin_id', String(adminId));
            formData.append('field', name);

            const token = localStorage.getItem('token');
            const res = await fetch(uploadProfileFileUrl, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            const data = await res.json().catch(() => ({}));

            const savedPath = data.path || data.file_path || data.url || data.doc_file || data.file || null;
            if (!res.ok || data.success === false || !savedPath) {
                setUploadError(data.message || 'Upload failed');
                return;
            }
            setProgress(100);
            onFileChange(name, savedPath);
        } catch (err) {
            setUploadError('Network error. Please try again.');
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        if (fileData && typeof fileData === 'object' && fileData.url) {
            URL.revokeObjectURL(fileData.url);
        }
        onFileChange(name, null);
        setPickedName('');
        localPreviewRef.current = false;
        setPreviewObjectUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return '';
        });
        setIsUploading(false);
        setProgress(0);
        setUploadError('');
        if (inputRef.current) inputRef.current.value = '';
    };

    const isImage = isImageFile(pickedName || fileData) || Boolean(previewObjectUrl);

    useEffect(() => {
        if (!fileData || typeof fileData !== 'string' || localPreviewRef.current) return undefined;
        if (/\.pdf($|\?)/i.test(fileData)) return undefined;
        const url = profileFileContentUrl(fileData);
        if (!url) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) return;
                const blob = await res.blob();
                if (cancelled || !String(blob.type || '').startsWith('image/')) return;
                setPreviewObjectUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return URL.createObjectURL(blob);
                });
            } catch {
                /* thumbnail stays empty until the file can be opened */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fileData]);

    return (
        <div className="input-box file-upload-box">
            <label htmlFor={name}>{label}</label>
            <input
                type="file"
                id={name}
                name={name}
                ref={inputRef}
                className="file-upload-native"
                accept={accept}
                onChange={handleActualFileChange}
                disabled={isUploading}
            />
            <button
                type="button"
                className="file-upload-choose"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
            >
                {fileData ? 'Change file' : 'Choose PDF or image'}
            </button>

            {isUploading && (
                <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>Uploading... {Math.min(99, progress)}%</p>
                    <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${Math.min(99, progress)}%`,
                                height: '100%',
                                backgroundColor: '#3b82f6',
                                transition: 'width 0.3s'
                            }}
                        />
                    </div>
                </div>
            )}

            {fileData && !isUploading && isImage && previewObjectUrl && (
                <div className="file-upload-thumb">
                    <div className="file-upload-thumb-photo">
                        <img src={previewObjectUrl} alt={getDisplayName() || 'Certificate'} />
                    </div>
                    <button
                        type="button"
                        className="file-upload-thumb-remove"
                        onClick={handleRemoveFile}
                        aria-label="Remove"
                    >
                        ×
                    </button>
                </div>
            )}

            {fileData && !isUploading && !isImage && (
                <div className="file-upload-preview-row">
                    <p className="file-upload-preview-name">{getDisplayName()}</p>
                    <button
                        type="button"
                        className="file-upload-row-remove"
                        onClick={handleRemoveFile}
                        aria-label="Remove"
                    >
                        ×
                    </button>
                </div>
            )}

            {(uploadError || error) && <p className="error-text">{uploadError || error}</p>}
        </div>
    );
}