import jwt from 'jsonwebtoken';

const asTrimmedString = (value: unknown) => String(value ?? '').trim();

const normalizeZoomHost = (host: string) => host.replace(/^www\./i, '').toLowerCase();

const isZoomHost = (host: string) => {
    const normalizedHost = normalizeZoomHost(host);
    return normalizedHost === 'zoom.us'
        || normalizedHost.endsWith('.zoom.us')
        || normalizedHost === 'zoomgov.com'
        || normalizedHost.endsWith('.zoomgov.com');
};

const extractMeetingNumberFromPath = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    const joinIndex = parts.findIndex((part) => part === 'j' || part === 'wc');
    if (joinIndex >= 0) {
        const rawMeetingNumber = parts[joinIndex + 1] || '';
        const digitsOnly = rawMeetingNumber.replace(/\D/g, '');
        return digitsOnly || null;
    }

    const digitsFromPath = pathname.replace(/\D/g, '');
    return digitsFromPath || null;
};

export const parseZoomMeetingDetails = (meetingLink: string, fallbackPasscode?: string | null) => {
    const trimmedLink = asTrimmedString(meetingLink);
    if (!trimmedLink) {
        throw new Error('Zoom meeting link is required');
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(trimmedLink);
    } catch {
        throw new Error('Zoom meeting link must be a valid URL');
    }

    if (!isZoomHost(parsedUrl.hostname)) {
        throw new Error('Zoom meeting link must use a zoom.us or zoomgov.com domain');
    }

    const meetingNumber = extractMeetingNumberFromPath(parsedUrl.pathname);
    if (!meetingNumber) {
        throw new Error('Unable to determine the Zoom meeting number from the meeting link');
    }

    const queryPasscode = asTrimmedString(
        parsedUrl.searchParams.get('passcode')
        || parsedUrl.searchParams.get('pwd')
        || '',
    );
    const passcode = asTrimmedString(fallbackPasscode || queryPasscode || '');

    return {
        meetingLink: trimmedLink,
        meetingNumber,
        passcode: passcode || null,
        host: normalizeZoomHost(parsedUrl.hostname),
    };
};

export const createZoomMeetingSignature = ({
    meetingNumber,
    role,
}: {
    meetingNumber: string;
    role: 0 | 1;
}) => {
    const sdkKey = asTrimmedString(process.env.ZOOM_MEETING_SDK_KEY || process.env.ZOOM_CLIENT_ID || '');
    const sdkSecret = asTrimmedString(process.env.ZOOM_MEETING_SDK_SECRET || process.env.ZOOM_CLIENT_SECRET || '');

    if (!sdkKey || !sdkSecret) {
        throw new Error('Zoom Meeting SDK credentials are not configured');
    }

    const issuedAt = Math.floor(Date.now() / 1000) - 30;
    const expiresAt = issuedAt + 60 * 60 * 2;

    return {
        sdkKey,
        signature: jwt.sign(
            {
                appKey: sdkKey,
                sdkKey,
                mn: meetingNumber,
                role,
                iat: issuedAt,
                exp: expiresAt,
                tokenExp: expiresAt,
            },
            sdkSecret,
            { algorithm: 'HS256' },
        ),
    };
};
