export const DOCUMENT_DOWNLOAD_NAMES = {
    aadharFront: 'Aadhaar_Front',
    aadharBack: 'Aadhaar_Back',
    panFront: 'PAN_Front',
    panBack: 'PAN_Back',
    passbookFront: 'Bank_Passbook',
    appointmentLetter: 'Appointment_Letter',
};

const MIME_BY_EXT = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
};

const EXT_BY_MIME = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
};

export function documentExtension(path) {
    const leaf = String(path || '').split('?')[0].split('/').pop() || '';
    const match = leaf.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : '';
}

export function documentMimeType(ext) {
    return MIME_BY_EXT[ext] || '';
}

export function extensionForMime(mimeType) {
    return EXT_BY_MIME[String(mimeType || '').toLowerCase().split(';')[0]] || '';
}

export async function fetchDocumentBlob(url) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
}
