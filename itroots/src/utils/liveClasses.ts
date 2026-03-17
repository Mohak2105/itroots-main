const EXTERNAL_URL_PATTERN = /^https?:\/\//i;
const LIVE_CLASS_ROUTE_PATTERN = /^\/(?:lms\/(?:student|teacher)\/)?live-classes\/([^/?#]+)/i;

export type LiveClassAudience = "TEACHER" | "STUDENT";

export type LiveClassJoinSource = {
    id?: string;
    provider?: string | null;
    joinPath?: string | null;
    meetingLink?: string | null;
};

export const buildLiveClassHref = (liveClassId: string, audience: LiveClassAudience) => (
    audience === "TEACHER"
        ? `/lms/teacher/live-classes/${liveClassId}`
        : `/lms/student/live-classes/${liveClassId}`
);

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

export const resolveLiveClassJoinTarget = (
    liveClass: LiveClassJoinSource,
    audience: LiveClassAudience = "STUDENT",
) => {
    const joinPath = String(liveClass.joinPath || "").trim();
    if (joinPath) {
        return {
            href: normalizeJoinPath(joinPath, audience),
            external: EXTERNAL_URL_PATTERN.test(joinPath),
        };
    }

    const provider = String(liveClass.provider || "").trim().toUpperCase();
    if (provider === "JITSI" && liveClass.id) {
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

    return { href: "", external: false };
};
