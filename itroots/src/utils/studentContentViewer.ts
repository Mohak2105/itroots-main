import { API_BASE_URL } from "@/config/api";

const BACKEND_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return "";
    }
})();

export const resolveStudentContentUrl = (targetUrl: string) => {
    const trimmedUrl = String(targetUrl || "").trim();
    if (!trimmedUrl) return "";

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
    const resolvedUrl = resolveStudentContentUrl(targetUrl);
    const params = new URLSearchParams({ url: resolvedUrl });
    if (title) {
        params.set("title", title);
    }
    return `/content-viewer?${params.toString()}`;
};

export const shouldOpenExternally = (title?: string, actionLabel?: string) => {
    const value = `${title || ""} ${actionLabel || ""}`.toUpperCase();
    return value.includes("LIVE CLASS") || value.includes("JOIN");
};