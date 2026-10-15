import { useEffect, useState } from 'react';
import { isNativeApp } from '../mobile/native/platform';

/**
 * On the phone, <img> does not send the login token, so profile photos
 * from solviotec.com fail and the placeholder stays. Load them with fetch
 * (the native API shim attaches auth and returns the file).
 */
export function useDisplayPhotoSrc(url) {
    const [src, setSrc] = useState(() => directSrc(url));

    useEffect(() => {
        const immediate = directSrc(url);
        if (immediate != null) {
            setSrc(immediate);
            return undefined;
        }

        let cancelled = false;
        let objectUrl = '';
        setSrc('');
        const token = localStorage.getItem('token');

        fetch(url, {
            cache: 'no-store',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('photo fetch failed');
                const blob = await res.blob();
                if (!blob || blob.size === 0) throw new Error('empty photo');
                objectUrl = URL.createObjectURL(blob);
                if (!cancelled) setSrc(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setSrc('');
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url]);

    return src;
}

function directSrc(url) {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (!isNativeApp()) return url;
    // The website loads these straight in an image tag. A signed link already
    // carries sig=, and public uploads do not need the login header.
    if (url.includes('/api/files/signed/') || url.includes('/static/')) return url;
    return null;
}
