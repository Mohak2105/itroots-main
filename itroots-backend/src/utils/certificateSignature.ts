import fs from 'fs';
import path from 'path';

const CERTIFICATE_SIGNATURE_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificate-signatures');
const CERTIFICATE_SIGNATURE_PREFIX = '/uploads/certificate-signatures/';
const ALLOWED_SIGNATURE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

const sanitizeFileName = (fileName?: string) => {
    const source = (fileName || 'certificate-signature').toLowerCase();
    const withoutExtension = source.replace(/\.[^.]+$/, '');
    const safe = withoutExtension.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return safe || 'certificate-signature';
};

const getImageExtension = (mimeType: string, fileName?: string) => {
    const extensionFromMime = mimeType.split('/')[1]?.toLowerCase() || '';
    if (extensionFromMime === 'jpeg') return 'jpg';
    if (extensionFromMime === 'svg+xml') return 'svg';
    if (extensionFromMime) return extensionFromMime;

    const extensionFromName = (fileName || '').split('.').pop()?.toLowerCase();
    return extensionFromName || 'png';
};

export const saveCertificateSignature = (fileData: string, fileName?: string) => {
    const match = fileData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
        throw new Error('Invalid signatory signature payload');
    }

    const [, mimeType, base64Payload] = match;
    if (!ALLOWED_SIGNATURE_MIME_TYPES.has(mimeType.toLowerCase())) {
        throw new Error('Signatory signature must be a PNG or JPG image');
    }
    const extension = getImageExtension(mimeType, fileName);
    const safeName = sanitizeFileName(fileName);
    const storedFileName = `${Date.now()}-${safeName}.${extension}`;

    fs.mkdirSync(CERTIFICATE_SIGNATURE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CERTIFICATE_SIGNATURE_DIR, storedFileName), Buffer.from(base64Payload, 'base64'));

    return `${CERTIFICATE_SIGNATURE_PREFIX}${storedFileName}`;
};

export const resolveStoredCertificateSignature = (signaturePath?: string | null) => {
    if (!signaturePath || !signaturePath.startsWith(CERTIFICATE_SIGNATURE_PREFIX)) {
        return null;
    }

    const storedFileName = path.basename(signaturePath);
    const resolvedPath = path.join(CERTIFICATE_SIGNATURE_DIR, storedFileName);
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
};
