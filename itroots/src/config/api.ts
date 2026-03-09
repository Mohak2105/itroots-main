export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
export const FRONTEND_ONLY_MODE = process.env.NEXT_PUBLIC_FRONTEND_ONLY_MODE === "true";
export const API_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return "http://localhost:5000";
    }
})();

export const ENDPOINTS = {
    PUBLIC: {
        CONTACT: `${API_BASE_URL}/public/contact`,
        ENROLL: `${API_BASE_URL}/public/enroll`,
        HIRE: `${API_BASE_URL}/public/hire`,
        COURSES: `${API_BASE_URL}/public/courses`,
    },
    AUTH: {
        LOGIN: `${API_BASE_URL}/auth/login`,
        REGISTER: `${API_BASE_URL}/auth/register`,
        ME: `${API_BASE_URL}/auth/me`,
        UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
        CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    },
    CMS: {
        COURSES: `${API_BASE_URL}/cms/courses`,
        LEADS: `${API_BASE_URL}/cms/leads`,
        PLACEMENTS: `${API_BASE_URL}/cms/placements`,
    },
    ADMIN: {
        DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
        USERS: `${API_BASE_URL}/admin/users`,
        USER_DETAIL: (userId: string) => `${API_BASE_URL}/admin/users/${userId}`,
        SEND_WELCOME_EMAIL: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/send-welcome-email`,
        STATS: `${API_BASE_URL}/admin/system-stats`,
        COURSES: `${API_BASE_URL}/admin/courses`,
        BATCHES: `${API_BASE_URL}/admin/batches`,
        STUDENTS: `${API_BASE_URL}/admin/students`,
        STUDENT_ASSIGNMENTS: (studentId: string) => `${API_BASE_URL}/admin/students/${studentId}/assignments`,
        STUDENT_PAYMENTS: (studentId: string) => `${API_BASE_URL}/admin/students/${studentId}/payments`,
        ENROLL_STUDENT: `${API_BASE_URL}/admin/students/enroll`,
        Faculty: `${API_BASE_URL}/admin/Faculty`,
        Faculty_ASSIGNMENTS: (FacultyId: string) => `${API_BASE_URL}/admin/Faculty/${FacultyId}/assignments`,
        PAYMENTS: `${API_BASE_URL}/admin/payments`,
        PAYMENT_ANALYTICS: `${API_BASE_URL}/admin/payments/analytics`,
        PAYMENT_RECEIPT: (paymentId: string) => `${API_BASE_URL}/admin/payments/${paymentId}/receipt`,
        CERTIFICATES: `${API_BASE_URL}/admin/certificates`,
        CERTIFICATE_DOWNLOAD: (certificateId: string) => `${API_BASE_URL}/admin/certificates/${certificateId}/download`,
        ANNOUNCEMENTS: `${API_BASE_URL}/admin/announcements`,
        NOTIFICATIONS: `${API_BASE_URL}/admin/notifications`,
    },
    Faculty: {
        BASE: `${API_BASE_URL}/Faculty`,
        DASHBOARD: `${API_BASE_URL}/Faculty/dashboard`,
        MY_BATCHES: `${API_BASE_URL}/Faculty/my-batches`,
        BATCH_DATA: `${API_BASE_URL}/Faculty/batch-data`,
        ADD_CONTENT: `${API_BASE_URL}/Faculty/batch-content`,
        CREATE_TEST: `${API_BASE_URL}/Faculty/tests`,
        TEST_RESULTS: `${API_BASE_URL}/Faculty/test-results`,
        ASSIGNMENTS: `${API_BASE_URL}/Faculty/assignments`,
        REVIEW_ASSIGNMENT: (submissionId: string) => `${API_BASE_URL}/Faculty/assignments/${submissionId}/review`,
        ANNOUNCEMENTS: `${API_BASE_URL}/Faculty/announcements`,
        LIVE_CLASSES: `${API_BASE_URL}/Faculty/live-classes`,
        CANCEL_LIVE_CLASS: (liveClassId: string) => `${API_BASE_URL}/Faculty/live-classes/${liveClassId}/cancel`,
        NOTIFICATIONS: `${API_BASE_URL}/Faculty/notifications`,
        MARK_NOTIFICATION_READ: (notificationId: string) => `${API_BASE_URL}/Faculty/notifications/${notificationId}/read`,
    },
    STUDENT: {
        BASE: `${API_BASE_URL}/student`,
        DASHBOARD: `${API_BASE_URL}/student/dashboard`,
        AVAILABLE_BATCHES: `${API_BASE_URL}/student/available-batches`,
        SELF_ENROLL: `${API_BASE_URL}/student/self-enroll`,
        MY_LEARNING: `${API_BASE_URL}/student/my-learning`,
        BATCH_RESOURCES: `${API_BASE_URL}/student/batch-resources`,
        ASSIGNMENTS: `${API_BASE_URL}/student/assignments`,
        SUBMIT_ASSIGNMENT: (assignmentId: string) => `${API_BASE_URL}/student/assignments/${assignmentId}/submit`,
        TESTS: `${API_BASE_URL}/student/tests`,
        SUBMIT_EXAM: `${API_BASE_URL}/student/submit-exam`,
        ATTENDANCE: `${API_BASE_URL}/student/attendance`,
        ANNOUNCEMENTS: `${API_BASE_URL}/student/announcements`,
        NOTIFICATIONS: `${API_BASE_URL}/student/notifications`,
        MARK_NOTIFICATION_READ: (notificationId: string) => `${API_BASE_URL}/student/notifications/${notificationId}/read`,
        LIVE_CLASSES: `${API_BASE_URL}/student/live-classes`,
        CERTIFICATES: `${API_BASE_URL}/student/certificates`,
        CERTIFICATE_DOWNLOAD: (certificateId: string) => `${API_BASE_URL}/student/certificates/${certificateId}/download`,
    }
};
