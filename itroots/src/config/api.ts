const LOCAL_API_BASE_URL = "http://localhost:5000/api/v1";
const LOCAL_API_ORIGIN = "http://localhost:5000";

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

function isLocalHostname(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getRuntimeApiBaseUrl() {
    if (typeof window === "undefined") {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
        if (siteUrl) {
            return `${trimTrailingSlash(siteUrl)}/api/v1`;
        }

        return LOCAL_API_BASE_URL;
    }

    if (isLocalHostname(window.location.hostname)) {
        const apiPort = process.env.NEXT_PUBLIC_API_PORT?.trim() || "5000";
        const protocol = window.location.protocol === "https:" ? "https:" : "http:";
        const hostname = window.location.hostname;

        return `${protocol}//${hostname}:${apiPort}/api/v1`;
    }

    return `${window.location.origin}/api/v1`;
}

function normalizeApiBaseUrl(value?: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
        return getRuntimeApiBaseUrl();
    }

    return trimTrailingSlash(trimmed);
}

export function getApiBaseUrl() {
    return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export const FRONTEND_ONLY_MODE = process.env.NEXT_PUBLIC_FRONTEND_ONLY_MODE === "true";

export function getApiOrigin() {
    try {
        return new URL(getApiBaseUrl()).origin;
    } catch {
        return LOCAL_API_ORIGIN;
    }
}

export const API_BASE_URL = getApiBaseUrl();
export const API_ORIGIN = getApiOrigin();

const withApiBase = (path: string) => `${getApiBaseUrl()}${path}`;

export const ENDPOINTS = {
    PUBLIC: {
        get CONTACT() { return withApiBase("/public/contact"); },
        get ENROLL() { return withApiBase("/public/enroll"); },
        get HIRE() { return withApiBase("/public/hire"); },
        get COURSES() { return withApiBase("/public/courses"); },
    },
    AUTH: {
        get LOGIN() { return withApiBase("/auth/login"); },
        get REGISTER() { return withApiBase("/auth/register"); },
        get ME() { return withApiBase("/auth/me"); },
        get UPDATE_PROFILE() { return withApiBase("/auth/profile"); },
        get CHANGE_PASSWORD() { return withApiBase("/auth/change-password"); },
    },
    CMS: {
        get COURSES() { return withApiBase("/cms/courses"); },
        get LEADS() { return withApiBase("/cms/leads"); },
        get PLACEMENTS() { return withApiBase("/cms/placements"); },
    },
    ADMIN: {
        get DASHBOARD() { return withApiBase("/admin/dashboard"); },
        get USERS() { return withApiBase("/admin/users"); },
        USER_DETAIL: (userId: string) => withApiBase(`/admin/users/${userId}`),
        IMPERSONATE: (userId: string) => withApiBase(`/admin/users/${userId}/impersonate`),
        SEND_WELCOME_EMAIL: (userId: string) => withApiBase(`/admin/users/${userId}/send-welcome-email`),
        get STATS() { return withApiBase("/admin/system-stats"); },
        get COURSES() { return withApiBase("/admin/courses"); },
        get BATCHES() { return withApiBase("/admin/batches"); },
        get STUDENTS() { return withApiBase("/admin/students"); },
        STUDENT_DASHBOARD_PREVIEW: (studentId: string) => withApiBase(`/admin/students/${studentId}/dashboard-preview`),
        STUDENT_ASSIGNMENTS: (studentId: string) => withApiBase(`/admin/students/${studentId}/assignments`),
        STUDENT_PAYMENTS: (studentId: string) => withApiBase(`/admin/students/${studentId}/payments`),
        get ENROLL_STUDENT() { return withApiBase("/admin/students/enroll"); },
        get Faculty() { return withApiBase("/admin/Faculty"); },
        Faculty_ASSIGNMENTS: (FacultyId: string) => withApiBase(`/admin/Faculty/${FacultyId}/assignments`),
        get PAYMENTS() { return withApiBase("/admin/payments"); },
        get PAYMENT_ANALYTICS() { return withApiBase("/admin/payments/analytics"); },
        PAYMENT_RECEIPT: (paymentId: string) => withApiBase(`/admin/payments/${paymentId}/receipt`),
        get CERTIFICATES() { return withApiBase("/admin/certificates"); },
        CERTIFICATE_DOWNLOAD: (certificateId: string) => withApiBase(`/admin/certificates/${certificateId}/download`),
        get ANNOUNCEMENTS() { return withApiBase("/admin/announcements"); },
        get NOTIFICATIONS() { return withApiBase("/admin/notifications"); },
        SEND_PLACEMENT: (placementId: string) => withApiBase(`/admin/placements/${placementId}/send`),
    },
    Faculty: {
        get BASE() { return withApiBase("/Faculty"); },
        get DASHBOARD() { return withApiBase("/Faculty/dashboard"); },
        get MY_BATCHES() { return withApiBase("/Faculty/my-batches"); },
        get BATCH_DATA() { return withApiBase("/Faculty/batch-data"); },
        BATCH_ANALYTICS: (batchId: string) => withApiBase(`/Faculty/batch-analytics/${batchId}`),
        get ATTENDANCE() { return withApiBase("/Faculty/attendance"); },
        BATCH_ATTENDANCE: (batchId: string, date?: string) =>
            withApiBase(`/Faculty/attendance/${batchId}${date ? `?date=${encodeURIComponent(date)}` : ""}`),
        get ADD_CONTENT() { return withApiBase("/Faculty/batch-content"); },
        UPDATE_CONTENT: (contentId: string) => withApiBase(`/Faculty/batch-content/${contentId}`),
        DELETE_CONTENT: (contentId: string) => withApiBase(`/Faculty/batch-content/${contentId}`),
        get TESTS() { return withApiBase("/Faculty/tests"); },
        get CREATE_TEST() { return withApiBase("/Faculty/tests"); },
        UPDATE_TEST: (testId: string) => withApiBase(`/Faculty/tests/${testId}`),
        DELETE_TEST: (testId: string) => withApiBase(`/Faculty/tests/${testId}`),
        get TEST_RESULTS() { return withApiBase("/Faculty/test-results"); },
        get ASSIGNMENTS() { return withApiBase("/Faculty/assignments"); },
        ASSIGNMENT_DETAIL: (assignmentId: string) => withApiBase(`/Faculty/assignments/${assignmentId}`),
        REVIEW_ASSIGNMENT: (submissionId: string) => withApiBase(`/Faculty/assignments/${submissionId}/review`),
        get ANNOUNCEMENTS() { return withApiBase("/Faculty/announcements"); },
        get LIVE_CLASSES() { return withApiBase("/Faculty/live-classes"); },
        LIVE_CLASS: (liveClassId: string) => withApiBase(`/Faculty/live-classes/${liveClassId}`),
        ZOOM_SIGNATURE: (liveClassId: string) => withApiBase(`/Faculty/live-classes/${liveClassId}/zoom-signature`),
        CANCEL_LIVE_CLASS: (liveClassId: string) => withApiBase(`/Faculty/live-classes/${liveClassId}/cancel`),
        COMPLETE_LIVE_CLASS: (liveClassId: string) => withApiBase(`/Faculty/live-classes/${liveClassId}/complete`),
        get NOTIFICATIONS() { return withApiBase("/Faculty/notifications"); },
        get SENT_NOTIFICATIONS() { return withApiBase("/Faculty/notifications/sent"); },
        get CREATE_NOTIFICATION() { return withApiBase("/Faculty/notifications"); },
        MARK_NOTIFICATION_READ: (notificationId: string) => withApiBase(`/Faculty/notifications/${notificationId}/read`),
    },
    STUDENT: {
        get BASE() { return withApiBase("/student"); },
        get DASHBOARD() { return withApiBase("/student/dashboard"); },
        get AVAILABLE_BATCHES() { return withApiBase("/student/available-batches"); },
        get SELF_ENROLL() { return withApiBase("/student/self-enroll"); },
        get MY_LEARNING() { return withApiBase("/student/my-learning"); },
        get BATCH_RESOURCES() { return withApiBase("/student/batch-resources"); },
        get ASSIGNMENTS() { return withApiBase("/student/assignments"); },
        SUBMIT_ASSIGNMENT: (assignmentId: string) => withApiBase(`/student/assignments/${assignmentId}/submit`),
        get TESTS() { return withApiBase("/student/tests"); },
        get SUBMIT_EXAM() { return withApiBase("/student/submit-exam"); },
        get ATTENDANCE() { return withApiBase("/student/attendance"); },
        get ANNOUNCEMENTS() { return withApiBase("/student/announcements"); },
        get NOTIFICATIONS() { return withApiBase("/student/notifications"); },
        MARK_NOTIFICATION_READ: (notificationId: string) => withApiBase(`/student/notifications/${notificationId}/read`),
        get LIVE_CLASSES() { return withApiBase("/student/live-classes"); },
        LIVE_CLASS: (liveClassId: string) => withApiBase(`/student/live-classes/${liveClassId}`),
        ZOOM_SIGNATURE: (liveClassId: string) => withApiBase(`/student/live-classes/${liveClassId}/zoom-signature`),
        get PLACEMENTS() { return withApiBase("/student/placements"); },
        get CERTIFICATES() { return withApiBase("/student/certificates"); },
        CERTIFICATE_DOWNLOAD: (certificateId: string) => withApiBase(`/student/certificates/${certificateId}/download`),
    }
};
