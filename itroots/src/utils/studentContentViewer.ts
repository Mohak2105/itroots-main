import { API_BASE_URL } from "@/config/api";

const BACKEND_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return "";
    }
})();

const INTERNAL_APP_PATH_PATTERN = /^\/(?!uploads(?:\/|$))/i;

export const isInternalAppPath = (targetUrl: string) => {
    const trimmedUrl = String(targetUrl || "").trim();
    return INTERNAL_APP_PATH_PATTERN.test(trimmedUrl);
};

export const resolveStudentContentUrl = (targetUrl: string) => {
    const trimmedUrl = String(targetUrl || "").trim();
    if (!trimmedUrl) return "";

    if (isInternalAppPath(trimmedUrl)) {
        return trimmedUrl;
    }

    try {
        return new URL(trimmedUrl).toString();
    } catch {
        if (trimmedUrl.startsWith("/")) {
            return `${BACKEND_ORIGIN}${trimmedUrl}`;
        }
        if (trimmedUrl.startsWith("uploads/")) {
            return `${BACKEND_ORIGIN}/${trimmedUrl}`;
        }
        return trimmedUrl;
    }
};

export const buildStudentContentViewerHref = (targetUrl: string, title?: string) => {
    const trimmedUrl = String(targetUrl || "").trim();
    if (isInternalAppPath(trimmedUrl)) {
        return trimmedUrl;
    }

    const resolvedUrl = resolveStudentContentUrl(targetUrl);
    const params = new URLSearchParams({ url: resolvedUrl });
    if (title) {
        params.set("title", title);
    }
    return `/content-viewer?${params.toString()}`;
};

export const extractStudentActionUrl = (value?: string) => {
    const text = String(value || "");

    const internalMatch = text.match(/\/(?:placements(?:\?[^\s]+)?|live-classes\/[^\s]+|lms\/[^\s]+)/i);
    if (internalMatch?.[0]) {
        return internalMatch[0];
    }

    const uploadMatch = text.match(/\/uploads\/[^\s]+/i);
    if (uploadMatch?.[0]) {
        return uploadMatch[0];
    }

    const externalMatch = text.match(/https?:\/\/\S+/i);
    return externalMatch?.[0];
};

export const buildStudentActionHref = (targetUrl: string, title?: string) => {
    const trimmedUrl = String(targetUrl || "").trim();
    if (!trimmedUrl) return "";
    return isInternalAppPath(trimmedUrl) ? trimmedUrl : buildStudentContentViewerHref(trimmedUrl, title);
};

export const shouldOpenExternally = (title?: string, actionLabel?: string, targetUrl?: string) => {
    if (targetUrl && isInternalAppPath(targetUrl)) {
        return false;
    }

    const value = `${title || ""} ${actionLabel || ""}`.toUpperCase();
    return value.includes("LIVE CLASS") || value.includes("JOIN");
};
