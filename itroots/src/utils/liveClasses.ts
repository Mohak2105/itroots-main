const EXTERNAL_URL_PATTERN = /^https?:\/\//i;
const LIVE_CLASS_ROUTE_PATTERN = /^\/(?:(?:lms\/(?:student|teacher)|student|faculty)\/)?live-classes\/([^/?#]+)/i;
export const LIVE_CLASS_SESSION_WINDOW_MINUTES = 120;
const LIVE_CLASS_SESSION_WINDOW_MS = LIVE_CLASS_SESSION_WINDOW_MINUTES * 60 * 1000;

export type LiveClassAudience = "TEACHER" | "STUDENT";
export type NormalizedLiveClassProvider = "JITSI" | "ZOOM" | "EXTERNAL";
export type LiveClassAccessState =
    | "AVAILABLE"
    | "NOT_STARTED"
    | "EXPIRED"
    | "CANCELLED"
    | "COMPLETED"
    | "UNAVAILABLE";

export type LiveClassJoinSource = {
    id?: string;
    provider?: string | null;
    joinPath?: string | null;
    meetingLink?: string | null;
    scheduledAt?: string | null;
    status?: string | null;
};

export const buildLiveClassHref = (liveClassId: string, audience: LiveClassAudience) => (
    audience === "TEACHER"
        ? `/lms/teacher/live-classes/${liveClassId}`
        : `/lms/student/live-classes/${liveClassId}`
);

export const getNormalizedLiveClassProvider = (provider?: string | null): NormalizedLiveClassProvider => {
    const normalized = String(provider || "").trim().toUpperCase();
    if (normalized === "ZOOM") return "ZOOM";
    if (normalized === "JITSI") return "JITSI";
    return "EXTERNAL";
};

export const isEmbeddedLiveClassProvider = (provider?: string | null) => {
    const normalized = getNormalizedLiveClassProvider(provider);
    return normalized === "ZOOM" || normalized === "JITSI";
};

export const getLiveClassProviderLabel = (provider?: string | null) => {
    const normalized = getNormalizedLiveClassProvider(provider);
    if (normalized === "ZOOM") return "Zoom Meeting";
    if (normalized === "JITSI") return "Jitsi Meeting";
    return "External Link";
};

const normalizeJoinPath = (joinPath: string, audience: LiveClassAudience) => {
    if (EXTERNAL_URL_PATTERN.test(joinPath)) {
        return joinPath;
    }

    const liveClassMatch = joinPath.match(LIVE_CLASS_ROUTE_PATTERN);
    if (liveClassMatch?.[1]) {
        return buildLiveClassHref(liveClassMatch[1], audience);
    }

    return joinPath;
};

export const getLiveClassAccessState = (
    liveClass: Pick<LiveClassJoinSource, "scheduledAt" | "status">,
    nowValue: number = Date.now(),
): LiveClassAccessState => {
    const status = String(liveClass.status || "").trim().toUpperCase();
    if (status === "CANCELLED") return "CANCELLED";
    if (status === "COMPLETED") return "COMPLETED";

    const scheduledAt = String(liveClass.scheduledAt || "").trim();
    if (!scheduledAt) return "UNAVAILABLE";

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) return "UNAVAILABLE";

    const scheduledTime = scheduledDate.getTime();
    if (nowValue < scheduledTime) return "NOT_STARTED";
    if (nowValue > scheduledTime + LIVE_CLASS_SESSION_WINDOW_MS) return "EXPIRED";
    return "AVAILABLE";
};

export const resolveLiveClassJoinTarget = (
    liveClass: LiveClassJoinSource,
    audience: LiveClassAudience = "STUDENT",
) => {
    const provider = getNormalizedLiveClassProvider(liveClass.provider);
    if ((provider === "ZOOM" || provider === "JITSI") && liveClass.id) {
        return {
            href: buildLiveClassHref(String(liveClass.id), audience),
            external: false,
        };
    }

    const meetingLink = String(liveClass.meetingLink || "").trim();
    if (meetingLink) {
        return {
            href: meetingLink,
            external: EXTERNAL_URL_PATTERN.test(meetingLink),
        };
    }

    const joinPath = String(liveClass.joinPath || "").trim();
    if (joinPath) {
        return {
            href: normalizeJoinPath(joinPath, audience),
            external: EXTERNAL_URL_PATTERN.test(joinPath),
        };
    }

    return { href: "", external: false };
};
