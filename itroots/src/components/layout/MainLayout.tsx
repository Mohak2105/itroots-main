"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import ScrollToTop from "@/components/ui/ScrollToTop/ScrollToTop";
import { API_BASE_URL, FRONTEND_ONLY_MODE } from "@/config/api";
import { courses as WEBSITE_COURSES } from "@/data/courses";
import { ANNOUNCEMENTS, BATCHES, COURSES, ENROLLMENTS, USERS } from "@/data/lms-data";



type MockApiUser = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    profileImage?: string;
};

type MockBatchContent = {
    id: string;
    batchId: string;
    title: string;
    description?: string;
    type: string;
    contentUrl: string;
    createdAt: string;
    fileType?: string;
    maxMarks?: number | null;
};

type MockAssignmentSubmission = {
    id: string;
    studentId: string;
    assignmentId: string;
    batchId: string;
    fileUrl: string;
    fileName: string;
    notes?: string;
    status: "SUBMITTED" | "REVIEWED";
    grade?: number | null;
    feedback?: string | null;
    submittedAt: string;
};

type MockNotification = {
    id: string;
    title: string;
    message: string;
    type: string;
    audienceType: string;
    sendEmail: boolean;
    createdBy: string;
    batchId?: string;
    courseId?: string;
    createdAt: string;
};

type MockNotificationRecipient = {
    id: string;
    notificationId: string;
    userId: string;
    emailSent: boolean;
    emailSentAt?: string | null;
    readAt?: string | null;
    createdAt: string;
};

const MOCK_USERS_KEY = "itroots_mock_users";
const MOCK_BATCH_CONTENTS_KEY = "itroots_mock_batch_contents";
const MOCK_SHARED_VIDEO_CONTENTS_COOKIE = "itroots_mock_shared_video_contents";
const MOCK_ASSIGNMENT_SUBMISSIONS_KEY = "itroots_mock_assignment_submissions";
const MOCK_NOTIFICATIONS_KEY = "itroots_mock_notifications";
const MOCK_NOTIFICATION_RECIPIENTS_KEY = "itroots_mock_notification_recipients";
const SESSION_KEY = "itroots_session";
const TAB_SESSION_KEY = "itroots_tab_session";

function toPortalRole(role: string) {
    const normalizedRole = String(role || "").trim().toUpperCase();

    if (normalizedRole === "FACULTY") return "Faculty";
    if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "ADMIN") return "SUPER_ADMIN";
    if (normalizedRole === "CMS_MANAGER" || normalizedRole === "CMS") return "CMS_MANAGER";
    return "STUDENT";
}

function readStoredMockUsers(): MockApiUser[] {
    try {
        const raw = localStorage.getItem(MOCK_USERS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStoredMockUsers(users: MockApiUser[]) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getMergedMockUsers() {
    const merged = new Map<string, MockApiUser>();

    USERS.forEach((user) => {
        merged.set(user.email.toLowerCase(), {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            phone: user.phone,
        });
    });

    readStoredMockUsers().forEach((user) => {
        const key = user.email.toLowerCase();
        const existing = merged.get(key);
        merged.set(key, { ...existing, ...user });
    });

    return Array.from(merged.values());
}

function parseStoredCollection<T>(raw: string | null): T[] {
    try {
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function readCookie(name: string) {
    if (typeof document === "undefined") return "";

    const match = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function writeCookie(name: string, value: string) {
    if (typeof document === "undefined") return;

    const baseCookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = baseCookie;
    document.cookie = `${baseCookie}; domain=localhost`;
}

function mergeMockBatchContents(...collections: MockBatchContent[][]) {
    const merged = new Map<string, MockBatchContent>();

    collections.flat().forEach((item) => {
        if (!item?.id) return;
        merged.set(item.id, item);
    });

    return Array.from(merged.values()).sort((left, right) => (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ));
}

function readStoredMockBatchContents() {
    if (typeof window === "undefined") return [];

    const localItems = parseStoredCollection<MockBatchContent>(localStorage.getItem(MOCK_BATCH_CONTENTS_KEY));
    const sharedVideoItems = parseStoredCollection<MockBatchContent>(readCookie(MOCK_SHARED_VIDEO_CONTENTS_COOKIE));

    return mergeMockBatchContents(localItems, sharedVideoItems);
}

function writeStoredMockBatchContents(contents: MockBatchContent[]) {
    if (typeof window === "undefined") return;

    localStorage.setItem(MOCK_BATCH_CONTENTS_KEY, JSON.stringify(contents));

    const sharedVideos = contents.filter((item) => String(item.type).toUpperCase() === "VIDEO");
    writeCookie(MOCK_SHARED_VIDEO_CONTENTS_COOKIE, JSON.stringify(sharedVideos));
}

function readStoredMockAssignmentSubmissions() {
    if (typeof window === "undefined") return [];
    return parseStoredCollection<MockAssignmentSubmission>(localStorage.getItem(MOCK_ASSIGNMENT_SUBMISSIONS_KEY));
}

function writeStoredMockAssignmentSubmissions(submissions: MockAssignmentSubmission[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(MOCK_ASSIGNMENT_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

function buildDefaultMockNotificationStore() {
    const adminUser = USERS.find((user) => toPortalRole(user.role) === "SUPER_ADMIN") || USERS[0];
    const facultyUsers = USERS.filter((user) => toPortalRole(user.role) === "Faculty");
    const seededAt = "2026-03-23T09:00:00.000Z";
    const notificationId = "mock-faculty-notification-welcome";

    const notifications: MockNotification[] = [
        {
            id: notificationId,
            title: "Admin Update: Faculty Notifications",
            message: "Important admin updates for faculty will appear in this inbox. You can also send notifications to your batch students from the same page.",
            type: "NOTIFICATION",
            audienceType: "ALL_Faculty",
            sendEmail: false,
            createdBy: adminUser?.id || "a1",
            createdAt: seededAt,
        },
    ];

    const recipients: MockNotificationRecipient[] = facultyUsers.map((user) => ({
        id: `mock-faculty-recipient-${user.id}`,
        notificationId,
        userId: user.id,
        emailSent: false,
        emailSentAt: null,
        readAt: null,
        createdAt: seededAt,
    }));

    return { notifications, recipients };
}

function readStoredMockNotifications() {
    if (typeof window === "undefined") return [];

    const raw = localStorage.getItem(MOCK_NOTIFICATIONS_KEY);
    return raw === null
        ? buildDefaultMockNotificationStore().notifications
        : parseStoredCollection<MockNotification>(raw);
}

function writeStoredMockNotifications(notifications: MockNotification[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function readStoredMockNotificationRecipients() {
    if (typeof window === "undefined") return [];

    const raw = localStorage.getItem(MOCK_NOTIFICATION_RECIPIENTS_KEY);
    return raw === null
        ? buildDefaultMockNotificationStore().recipients
        : parseStoredCollection<MockNotificationRecipient>(raw);
}

function writeStoredMockNotificationRecipients(recipients: MockNotificationRecipient[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(MOCK_NOTIFICATION_RECIPIENTS_KEY, JSON.stringify(recipients));
}

function seedMockNotificationsIfMissing() {
    if (typeof window === "undefined") return;

    const defaults = buildDefaultMockNotificationStore();

    if (localStorage.getItem(MOCK_NOTIFICATIONS_KEY) === null) {
        writeStoredMockNotifications(defaults.notifications);
    }

    if (localStorage.getItem(MOCK_NOTIFICATION_RECIPIENTS_KEY) === null) {
        writeStoredMockNotificationRecipients(defaults.recipients);
    }
}

function normalizeMockMaxMarks(value: unknown, fallback = 100) {
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

function inferMimeType(fileName: string) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
    if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (lower.endsWith(".epub")) return "application/epub+zip";
    if (lower.endsWith(".mobi")) return "application/x-mobipocket-ebook";
    return "application/octet-stream";
}

function buildMockContentUrl(fileData: string, fileName: string) {
    return `data:${inferMimeType(fileName)};base64,${fileData}`;
}

function resolveMockUploadedFileUrl(fileData: string, fileName: string) {
    return fileData.startsWith("data:") ? fileData : buildMockContentUrl(fileData, fileName);
}

function getMockUserById(userId: string) {
    return [...USERS, ...readStoredMockUsers()].find((user) => user.id === userId);
}

function mapMockContentForStudent(content: MockBatchContent) {
    const batch = BATCHES.find((item) => item.id === content.batchId);
    const course = COURSES.find((item) => item.id === batch?.courseId);

    return {
        id: content.id,
        title: content.title,
        description: content.description || "",
        type: content.type,
        subject: course?.title || batch?.name || "Course",
        fileType: content.fileType || content.type,
        fileUrl: content.contentUrl,
        contentUrl: content.contentUrl,
        uploadedAt: content.createdAt,
        createdAt: content.createdAt,
        batchId: content.batchId,
        maxMarks: normalizeMockMaxMarks(content.maxMarks),
    };
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Immediately detectable via path — no header/footer needed
    const isAppPath =
        pathname?.startsWith("/lms") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/student") ||
        pathname?.startsWith("/faculty") ||
        pathname?.startsWith("/content-viewer");

    // Hostname-based detection (admin / student / Faculty subdomains)
    const [isAppHost, setIsAppHost] = useState<boolean | null>(null);

    useEffect(() => {
        const h = window.location.hostname.toLowerCase();
        setIsAppHost(h.startsWith("admin") || h.startsWith("student") || h.startsWith("faculty"));
    }, []);

    useEffect(() => {
        if (!FRONTEND_ONLY_MODE) return;

        const win = window as Window & {
            __itrootsMockFetchInstalled?: boolean;
            __itrootsOriginalFetch?: typeof window.fetch;
        };

        if (win.__itrootsMockFetchInstalled) return;

        const originalFetch = window.fetch.bind(window);
        win.__itrootsMockFetchInstalled = true;
        win.__itrootsOriginalFetch = originalFetch;
        const existingMockContents = readStoredMockBatchContents();
        if (existingMockContents.length) {
            writeStoredMockBatchContents(existingMockContents);
        }
        seedMockNotificationsIfMissing();

        const makeResponse = (payload: unknown, status = 200) =>
            new Response(JSON.stringify(payload), {
                status,
                headers: { "Content-Type": "application/json" },
            });

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
            if (!url.startsWith(API_BASE_URL)) {
                return originalFetch(input, init);
            }

            const parsedUrl = new URL(url);
            const apiBasePath = new URL(API_BASE_URL).pathname;
            const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();
            const path = parsedUrl.pathname.replace(apiBasePath, "") || "/";
            const searchParams = parsedUrl.searchParams;
            const allUsers: MockApiUser[] = getMergedMockUsers();
            const currentUser = (() => {
                try {
                    const saved = sessionStorage.getItem(TAB_SESSION_KEY) || localStorage.getItem(SESSION_KEY);
                    return saved ? JSON.parse(saved) : null;
                } catch {
                    return null;
                }
            })();
            const writeActiveMockSessionUser = (nextUser: Record<string, unknown>) => {
                try {
                    if (sessionStorage.getItem(TAB_SESSION_KEY)) {
                        sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(nextUser));
                    } else {
                        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
                    }
                } catch {
                    // Ignore storage failures in frontend-only mode.
                }
            };

            let body: Record<string, unknown> = {};
            if (typeof init?.body === "string") {
                try {
                    body = JSON.parse(init.body);
                } catch {
                    body = {};
                }
            }

            const dedupeMockUsers = (users: Array<MockApiUser | undefined | null>) => {
                const seen = new Map<string, MockApiUser>();
                users.forEach((user) => {
                    if (user?.id && !seen.has(user.id)) {
                        seen.set(user.id, user);
                    }
                });
                return Array.from(seen.values());
            };

            const getMockBatchById = (batchId?: string) => {
                if (!batchId) return null;
                return BATCHES.find((item) => item.id === batchId) || null;
            };

            const getMockCourseById = (courseId?: string) => {
                if (!courseId) return null;
                return COURSES.find((item) => item.id === courseId) || null;
            };

            const buildMockNotificationRecipientPayload = (recipient: MockNotificationRecipient) => {
                const notification = readStoredMockNotifications().find((item) => item.id === recipient.notificationId);
                if (!notification) return null;

                const batch = getMockBatchById(notification.batchId);
                const course = getMockCourseById(notification.courseId || batch?.courseId);
                const creator = getMockUserById(notification.createdBy);

                return {
                    ...recipient,
                    notification: {
                        ...notification,
                        batch: batch ? { id: batch.id, name: batch.name } : null,
                        course: course ? { id: course.id, title: course.title } : null,
                        creator: creator ? {
                            id: creator.id,
                            name: creator.name,
                            email: creator.email,
                            role: toPortalRole(creator.role),
                        } : null,
                    },
                };
            };

            const buildMockNotificationPayload = (notification: MockNotification) => {
                const batch = getMockBatchById(notification.batchId);
                const course = getMockCourseById(notification.courseId || batch?.courseId);
                const creator = getMockUserById(notification.createdBy);
                const recipients = readStoredMockNotificationRecipients()
                    .filter((item) => item.notificationId === notification.id)
                    .map((item) => ({
                        ...item,
                        user: (() => {
                            const user = getMockUserById(item.userId);
                            return user ? {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: toPortalRole(user.role),
                            } : null;
                        })(),
                    }));

                return {
                    ...notification,
                    batch: batch ? { id: batch.id, name: batch.name } : null,
                    course: course ? { id: course.id, title: course.title } : null,
                    creator: creator ? {
                        id: creator.id,
                        name: creator.name,
                        email: creator.email,
                        role: toPortalRole(creator.role),
                    } : null,
                    recipients,
                };
            };

            const resolveMockUsersForAudience = (audienceType: string, batchId?: string, courseId?: string) => {
                const normalizedAudience = String(audienceType || "").trim().toUpperCase();

                if (normalizedAudience === "ALL_STUDENTS") {
                    return allUsers.filter((user) => toPortalRole(user.role) === "STUDENT");
                }

                if (normalizedAudience === "ALL_FACULTY") {
                    return allUsers.filter((user) => toPortalRole(user.role) === "Faculty");
                }

                if (normalizedAudience === "ALL_USERS") {
                    return allUsers.filter((user) => ["STUDENT", "Faculty", "SUPER_ADMIN", "CMS_MANAGER"].includes(toPortalRole(user.role)));
                }

                if (normalizedAudience === "SELECTED_BATCH") {
                    const batch = getMockBatchById(batchId);
                    if (!batch) return [];

                    const batchStudents = ENROLLMENTS
                        .filter((item) => item.batchId === batch.id)
                        .map((item) => getMockUserById(item.studentId));
                    const batchFaculty = getMockUserById(batch.FacultyId);

                    return dedupeMockUsers([...batchStudents, batchFaculty]);
                }

                if (normalizedAudience === "SELECTED_COURSE") {
                    const course = getMockCourseById(courseId);
                    if (!course) return [];

                    const courseBatches = BATCHES.filter((item) => item.courseId === course.id);
                    const studentUsers = ENROLLMENTS
                        .filter((item) => courseBatches.some((batch) => batch.id === item.batchId))
                        .map((item) => getMockUserById(item.studentId));
                    const facultyUsers = courseBatches.map((batch) => getMockUserById(batch.FacultyId));

                    return dedupeMockUsers([...studentUsers, ...facultyUsers]);
                }

                return [];
            };

            if (path === "/public/courses" && method === "GET") {
                return makeResponse(WEBSITE_COURSES);
            }

            if (path === "/public/contact" && method === "POST") {
                const existing = JSON.parse(localStorage.getItem("itroots_contact_submissions") || "[]");
                const submissions = Array.isArray(existing) ? existing : [];
                submissions.push({ ...body, submittedAt: new Date().toISOString() });
                localStorage.setItem("itroots_contact_submissions", JSON.stringify(submissions));
                return makeResponse({ success: true, message: "Message received (frontend mode)." });
            }

            if (path === "/public/enroll" && method === "POST") {
                return makeResponse({ success: true, message: "Enrollment request saved (frontend mode)." });
            }

            if (path === "/public/hire" && method === "POST") {
                return makeResponse({ success: true, message: "Hire request saved (frontend mode)." });
            }

            if (path === "/auth/login" && method === "POST") {
                const email = String(body.email || "").trim().toLowerCase();
                const password = String(body.password || "");
                const matched = allUsers.find((u) => u.email.toLowerCase() === email && u.password === password);

                if (!matched) return makeResponse({ message: "Invalid email or password" }, 401);

                return makeResponse({
                    user: {
                        id: matched.id,
                        name: matched.name,
                        email: matched.email,
                        role: toPortalRole(matched.role),
                        isActive: true,
                    },
                    token: `mock-token-${matched.id}-${Date.now()}`,
                });
            }

            if (path === "/auth/register" && method === "POST") {
                const email = String(body.email || "").trim().toLowerCase();
                if (allUsers.some((u) => u.email.toLowerCase() === email)) {
                    return makeResponse({ message: "Email already registered" }, 400);
                }

                const stored = readStoredMockUsers();
                stored.push({
                    id: `mock-${Date.now()}`,
                    name: String(body.name || "New User"),
                    email,
                    password: String(body.password || ""),
                    role: String(body.role || "STUDENT"),
                });
                writeStoredMockUsers(stored);
                return makeResponse({ success: true, message: "Registration successful." });
            }

            if (path === "/auth/profile" && method === "PUT") {
                if (!currentUser) {
                    return makeResponse({ message: "Unauthorized" }, 401);
                }

                const nextName = String(body.name || currentUser.name || "").trim();
                if (!nextName) {
                    return makeResponse({ message: "Name is required" }, 400);
                }

                const nextPhone = String(body.phone || "").trim();
                const removeProfileImage = body.removeProfileImage === true;
                const nextProfileImage = typeof body.fileData === "string" && body.fileData.startsWith("data:image/")
                    ? body.fileData
                    : removeProfileImage
                        ? undefined
                        : currentUser.profileImage;

                const updatedUser = {
                    ...currentUser,
                    name: nextName,
                    phone: nextPhone,
                    profileImage: nextProfileImage,
                };

                writeActiveMockSessionUser(updatedUser);

                const storedUsers = readStoredMockUsers();
                const existingIndex = storedUsers.findIndex((user) => user.email.toLowerCase() === String(currentUser.email || "").toLowerCase());
                const fallbackUser = allUsers.find((user) => user.email.toLowerCase() === String(currentUser.email || "").toLowerCase());
                const updatedStoredUser: MockApiUser = {
                    id: String(currentUser.id || fallbackUser?.id || `mock-${Date.now()}`),
                    name: nextName,
                    email: String(currentUser.email || fallbackUser?.email || ""),
                    password: String((existingIndex >= 0 ? storedUsers[existingIndex].password : fallbackUser?.password) || ""),
                    role: String((existingIndex >= 0 ? storedUsers[existingIndex].role : fallbackUser?.role) || currentUser.role || "STUDENT"),
                    phone: nextPhone,
                    profileImage: nextProfileImage,
                };

                if (existingIndex >= 0) {
                    storedUsers[existingIndex] = updatedStoredUser;
                } else {
                    storedUsers.push(updatedStoredUser);
                }

                writeStoredMockUsers(storedUsers);

                return makeResponse({
                    message: removeProfileImage ? "Profile photo deleted successfully." : "Profile updated successfully.",
                    user: updatedUser,
                });
            }

            if (path === "/admin/notifications" && method === "GET") {
                const notifications = readStoredMockNotifications()
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map(buildMockNotificationPayload);
                return makeResponse(notifications);
            }

            if (path === "/admin/notifications" && method === "POST") {
                const title = String(body.title || "").trim();
                const message = String(body.message || "").trim();
                const audienceType = String(body.audienceType || "").trim();
                const notificationType = String(body.type || "NOTIFICATION").trim().toUpperCase();
                const batchId = String(body.batchId || "").trim() || undefined;
                const courseId = String(body.courseId || "").trim() || undefined;

                if (!title || !message || !audienceType) {
                    return makeResponse({ message: "title, message and audienceType are required" }, 400);
                }

                const recipientUsers = resolveMockUsersForAudience(audienceType, batchId, courseId);
                if (!recipientUsers.length) {
                    return makeResponse({ message: "No recipients found for the selected audience" }, 400);
                }

                const notificationId = `mock-notification-${Date.now()}`;
                const createdAt = new Date().toISOString();
                const nextNotification: MockNotification = {
                    id: notificationId,
                    title,
                    message,
                    type: notificationType,
                    audienceType,
                    sendEmail: false,
                    createdBy: currentUser?.id || "a1",
                    batchId,
                    courseId,
                    createdAt,
                };

                writeStoredMockNotifications([...readStoredMockNotifications(), nextNotification]);
                writeStoredMockNotificationRecipients([
                    ...readStoredMockNotificationRecipients(),
                    ...recipientUsers.map((recipient) => ({
                        id: `mock-notification-recipient-${notificationId}-${recipient.id}`,
                        notificationId,
                        userId: recipient.id,
                        emailSent: false,
                        emailSentAt: null,
                        readAt: null,
                        createdAt,
                    })),
                ]);

                return makeResponse({
                    message: "Notification sent successfully",
                    recipientCount: recipientUsers.length,
                    notification: buildMockNotificationPayload(nextNotification),
                }, 201);
            }

            if (path.startsWith("/admin/notifications/") && method === "DELETE") {
                const notificationId = path.replace("/admin/notifications/", "");
                writeStoredMockNotifications(readStoredMockNotifications().filter((item) => item.id !== notificationId));
                writeStoredMockNotificationRecipients(readStoredMockNotificationRecipients().filter((item) => item.notificationId !== notificationId));
                return makeResponse({ message: "Notification deleted successfully" });
            }

            if (path === "/Faculty/notifications" && method === "GET") {
                const facultyId = currentUser?.id || "t1";
                const inbox = readStoredMockNotificationRecipients()
                    .filter((item) => item.userId === facultyId)
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map(buildMockNotificationRecipientPayload)
                    .filter(Boolean);
                return makeResponse(inbox);
            }

            if (path === "/Faculty/notifications/sent" && method === "GET") {
                const facultyId = currentUser?.id || "t1";
                const notifications = readStoredMockNotifications()
                    .filter((item) => item.createdBy === facultyId && item.audienceType === "SELECTED_BATCH_STUDENTS")
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map(buildMockNotificationPayload);
                return makeResponse(notifications);
            }

            if (path === "/Faculty/notifications" && method === "POST") {
                const facultyId = currentUser?.id || "t1";
                const title = String(body.title || "").trim();
                const message = String(body.message || "").trim();
                const batchId = String(body.batchId || "").trim();
                const notificationType = String(body.type || "ANNOUNCEMENT").trim().toUpperCase();

                if (!title || !message || !batchId) {
                    return makeResponse({ message: "title, message, and batchId are required" }, 400);
                }

                const batch = BATCHES.find((item) => item.id === batchId && item.FacultyId === facultyId);
                if (!batch) {
                    return makeResponse({ message: "Batch not found or not assigned to this teacher" }, 404);
                }

                const recipientUsers = dedupeMockUsers(
                    ENROLLMENTS
                        .filter((item) => item.batchId === batch.id)
                        .map((item) => getMockUserById(item.studentId))
                );

                if (!recipientUsers.length) {
                    return makeResponse({ message: "No active students are enrolled in this batch" }, 400);
                }

                const createdAt = new Date().toISOString();
                const notificationId = `mock-faculty-notification-${Date.now()}`;
                const nextNotification: MockNotification = {
                    id: notificationId,
                    title,
                    message,
                    type: notificationType,
                    audienceType: "SELECTED_BATCH_STUDENTS",
                    sendEmail: false,
                    createdBy: facultyId,
                    batchId: batch.id,
                    courseId: batch.courseId,
                    createdAt,
                };

                writeStoredMockNotifications([...readStoredMockNotifications(), nextNotification]);
                writeStoredMockNotificationRecipients([
                    ...readStoredMockNotificationRecipients(),
                    ...recipientUsers.map((recipient) => ({
                        id: `mock-notification-recipient-${notificationId}-${recipient.id}`,
                        notificationId,
                        userId: recipient.id,
                        emailSent: false,
                        emailSentAt: null,
                        readAt: null,
                        createdAt,
                    })),
                ]);

                return makeResponse({
                    message: "Notification sent successfully",
                    recipientCount: recipientUsers.length,
                    notification: buildMockNotificationPayload(nextNotification),
                }, 201);
            }

            if (path.startsWith("/Faculty/notifications/") && path.endsWith("/read") && method === "PATCH") {
                const notificationId = path.replace("/Faculty/notifications/", "").replace("/read", "");
                const facultyId = currentUser?.id || "t1";
                const recipients = readStoredMockNotificationRecipients();
                const recipientIndex = recipients.findIndex((item) => item.notificationId === notificationId && item.userId === facultyId);

                if (recipientIndex === -1) {
                    return makeResponse({ message: "Notification not found" }, 404);
                }

                recipients[recipientIndex] = {
                    ...recipients[recipientIndex],
                    readAt: new Date().toISOString(),
                };
                writeStoredMockNotificationRecipients(recipients);
                return makeResponse({ message: "Notification marked as read" });
            }

            if (path === "/Faculty/my-batches" && method === "GET") {
                const FacultyId = currentUser?.id || "t1";
                const FacultyBatches = BATCHES
                    .filter((b) => b.FacultyId === FacultyId)
                    .map((b) => ({ ...b, course: COURSES.find((c) => c.id === b.courseId) }));
                return makeResponse(FacultyBatches);
            }

            if (path.startsWith("/Faculty/batch-data/") && method === "GET") {
                const batchId = path.replace("/Faculty/batch-data/", "");
                const enrollments = ENROLLMENTS.filter((e) => e.batchId === batchId).map((e) => ({
                    ...e,
                    student: USERS.find((u) => u.id === e.studentId),
                }));
                const contents = readStoredMockBatchContents().filter((item) => item.batchId === batchId);
                return makeResponse({
                    success: true,
                    data: {
                        id: batchId,
                        enrollments,
                        contents,
                        tests: [],
                    },
                });
            }

            if (path === "/Faculty/tests" && method === "POST") {
                return makeResponse({ success: true, message: "Test created (frontend mode)." });
            }

            if (path === "/Faculty/batch-content" && method === "POST") {
                const batchId = String(body.batchId || "");
                const title = String(body.title || "").trim();
                const type = String(body.type || "RESOURCE").trim().toUpperCase();
                const description = String(body.description || "").trim();
                let contentUrl = String(body.contentUrl || "").trim();
                const maxMarks = type === "ASSIGNMENT" ? normalizeMockMaxMarks(body.maxMarks, 0) : null;

                if (!contentUrl && typeof body.fileData === "string" && typeof body.fileName === "string") {
                    contentUrl = resolveMockUploadedFileUrl(body.fileData, body.fileName);
                }

                if (!batchId || !title || !contentUrl) {
                    return makeResponse({ message: "batchId, title, and content are required" }, 400);
                }

                if (type === "ASSIGNMENT" && !maxMarks) {
                    return makeResponse({ message: "maxMarks is required for assignments and must be a positive whole number" }, 400);
                }

                const batch = BATCHES.find((item) => item.id === batchId);
                if (!batch) {
                    return makeResponse({ message: "Batch not found" }, 404);
                }

                const existingContents = readStoredMockBatchContents();
                const nextContent: MockBatchContent = {
                    id: `mock-content-${Date.now()}`,
                    batchId,
                    title,
                    description,
                    type,
                    contentUrl,
                    createdAt: new Date().toISOString(),
                    fileType: String(body.materialFormat || type),
                    maxMarks,
                };

                writeStoredMockBatchContents([...existingContents, nextContent]);
                return makeResponse(nextContent, 201);
            }

            if (path.startsWith("/Faculty/batch-content/") && method === "PATCH") {
                const contentId = path.replace("/Faculty/batch-content/", "");
                const existingContents = readStoredMockBatchContents();
                const itemIndex = existingContents.findIndex((item) => item.id === contentId);

                if (itemIndex === -1) {
                    return makeResponse({ message: "Content not found" }, 404);
                }

                const existingItem = existingContents[itemIndex];
                const submissions = readStoredMockAssignmentSubmissions().filter((item) => item.assignmentId === contentId);
                const normalizedType = String(existingItem.type || "").toUpperCase();
                let contentUrl = String(body.contentUrl || existingItem.contentUrl || "").trim();
                if (!contentUrl && typeof body.fileData === "string" && typeof body.fileName === "string") {
                    contentUrl = resolveMockUploadedFileUrl(body.fileData, body.fileName);
                }

                const nextBatchId = String(body.batchId || existingItem.batchId);
                const nextMaxMarks = body.maxMarks === undefined
                    ? normalizeMockMaxMarks(existingItem.maxMarks)
                    : normalizeMockMaxMarks(body.maxMarks, 0);

                if (normalizedType === "ASSIGNMENT") {
                    if (!nextMaxMarks) {
                        return makeResponse({ message: "maxMarks is required for assignments and must be a positive whole number" }, 400);
                    }

                    const changingLockedField = submissions.length > 0 && (
                        nextBatchId !== existingItem.batchId
                        || contentUrl !== existingItem.contentUrl
                        || nextMaxMarks !== normalizeMockMaxMarks(existingItem.maxMarks)
                    );

                    if (changingLockedField) {
                        return makeResponse({ message: "Assignments with submissions can only update title and description" }, 409);
                    }
                }

                const nextItem: MockBatchContent = {
                    ...existingItem,
                    batchId: nextBatchId,
                    title: String(body.title || existingItem.title).trim(),
                    description: String(body.description ?? existingItem.description ?? "").trim(),
                    contentUrl,
                    maxMarks: normalizedType === "ASSIGNMENT" ? nextMaxMarks : null,
                };

                const nextContents = [...existingContents];
                nextContents[itemIndex] = nextItem;
                writeStoredMockBatchContents(nextContents);
                return makeResponse({ success: true, data: nextItem });
            }

            if (path.startsWith("/Faculty/batch-content/") && method === "DELETE") {
                const contentId = path.replace("/Faculty/batch-content/", "");
                const existingContents = readStoredMockBatchContents();
                const existingItem = existingContents.find((item) => item.id === contentId);

                if (!existingItem) {
                    return makeResponse({ message: "Content not found" }, 404);
                }

                if (
                    String(existingItem.type || "").toUpperCase() === "ASSIGNMENT"
                    && readStoredMockAssignmentSubmissions().some((item) => item.assignmentId === contentId)
                ) {
                    return makeResponse({ message: "Assignments with student submissions cannot be deleted" }, 409);
                }

                const nextContents = existingContents.filter((item) => item.id !== contentId);

                writeStoredMockBatchContents(nextContents);
                return makeResponse({ success: true, message: "Content deleted successfully" });
            }

            if (path.startsWith("/Faculty/test-results/") && method === "GET") {
                return makeResponse({ success: true, data: [] });
            }

            if (path === "/Faculty/assignments" && method === "GET") {
                const FacultyId = currentUser?.id || "t1";
                const FacultyBatchIds = BATCHES
                    .filter((batch) => batch.FacultyId === FacultyId)
                    .map((batch) => batch.id);
                const submissions = readStoredMockAssignmentSubmissions();

                const assignments = readStoredMockBatchContents()
                    .filter((item) => String(item.type).toUpperCase() === "ASSIGNMENT" && FacultyBatchIds.includes(item.batchId))
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map((assignment) => {
                        const batch = BATCHES.find((item) => item.id === assignment.batchId);
                        const course = COURSES.find((item) => item.id === batch?.courseId);
                        const assignmentSubmissions = submissions
                            .filter((item) => item.assignmentId === assignment.id)
                            .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
                        const activeEnrollments = ENROLLMENTS.filter((item) => item.batchId === assignment.batchId);
                        const mappedSubmissions = assignmentSubmissions.map((submission) => {
                            const student = getMockUserById(submission.studentId);
                            return {
                                id: submission.id,
                                studentId: submission.studentId,
                                studentName: student?.name || "Student",
                                studentEmail: student?.email || "",
                                fileUrl: submission.fileUrl,
                                fileName: submission.fileName,
                                notes: submission.notes || "",
                                status: submission.status,
                                grade: submission.grade ?? null,
                                feedback: submission.feedback ?? null,
                                submittedAt: submission.submittedAt,
                            };
                        });

                        return {
                            id: assignment.id,
                            title: assignment.title,
                            description: assignment.description || "",
                            contentUrl: assignment.contentUrl,
                            createdAt: assignment.createdAt,
                            batchId: assignment.batchId,
                            batchName: batch?.name || "Batch",
                            courseName: course?.title || "Course",
                            maxMarks: normalizeMockMaxMarks(assignment.maxMarks),
                            submissionStats: {
                                totalSubmitted: mappedSubmissions.length,
                                pendingReview: mappedSubmissions.filter((item) => item.status === "SUBMITTED").length,
                                reviewed: mappedSubmissions.filter((item) => item.status === "REVIEWED").length,
                                totalEligibleStudents: activeEnrollments.length,
                                unsubmitted: Math.max(activeEnrollments.length - mappedSubmissions.length, 0),
                            },
                            hasSubmissions: mappedSubmissions.length > 0,
                            submissions: mappedSubmissions,
                        };
                    });

                return makeResponse(assignments);
            }

            const FacultyAssignmentDetailMatch = path.match(/^\/Faculty\/assignments\/([^/]+)$/);
            if (FacultyAssignmentDetailMatch && method === "GET") {
                const FacultyId = currentUser?.id || "t1";
                const assignmentId = FacultyAssignmentDetailMatch[1];
                const assignment = readStoredMockBatchContents().find((item) => item.id === assignmentId && String(item.type).toUpperCase() === "ASSIGNMENT");
                const batch = assignment ? BATCHES.find((item) => item.id === assignment.batchId) : null;

                if (!assignment || !batch || batch.FacultyId !== FacultyId) {
                    return makeResponse({ message: "Assignment not found" }, 404);
                }

                const course = COURSES.find((item) => item.id === batch.courseId);
                const submissions = readStoredMockAssignmentSubmissions()
                    .filter((item) => item.assignmentId === assignmentId)
                    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
                const activeEnrollments = ENROLLMENTS.filter((item) => item.batchId === batch.id);
                const submittedStudentIds = new Set(submissions.map((item) => item.studentId));

                const submittedStudents = submissions.map((submission) => {
                    const student = getMockUserById(submission.studentId);
                    return {
                        id: submission.id,
                        studentId: submission.studentId,
                        studentName: student?.name || "Student",
                        studentEmail: student?.email || "",
                        fileUrl: submission.fileUrl,
                        fileName: submission.fileName,
                        notes: submission.notes || "",
                        status: submission.status,
                        grade: submission.grade ?? null,
                        feedback: submission.feedback ?? null,
                        submittedAt: submission.submittedAt,
                    };
                });

                const unsubmittedStudents = activeEnrollments
                    .filter((enrollment) => !submittedStudentIds.has(enrollment.studentId))
                    .map((enrollment) => {
                        const student = getMockUserById(enrollment.studentId);
                        return {
                            studentId: enrollment.studentId,
                            studentName: student?.name || "Student",
                            studentEmail: student?.email || "",
                            enrollmentStatus: "ACTIVE",
                        };
                    });

                return makeResponse({
                    id: assignment.id,
                    title: assignment.title,
                    description: assignment.description || "",
                    contentUrl: assignment.contentUrl,
                    createdAt: assignment.createdAt,
                    batchId: assignment.batchId,
                    batchName: batch.name,
                    courseName: course?.title || "Course",
                    maxMarks: normalizeMockMaxMarks(assignment.maxMarks),
                    hasSubmissions: submittedStudents.length > 0,
                    submissionStats: {
                        totalSubmitted: submittedStudents.length,
                        pendingReview: submittedStudents.filter((item) => item.status === "SUBMITTED").length,
                        reviewed: submittedStudents.filter((item) => item.status === "REVIEWED").length,
                        totalEligibleStudents: activeEnrollments.length,
                        unsubmitted: unsubmittedStudents.length,
                    },
                    submittedStudents,
                    unsubmittedStudents,
                });
            }

            const FacultyAssignmentReviewMatch = path.match(/^\/Faculty\/assignments\/([^/]+)\/review$/);
            if (FacultyAssignmentReviewMatch && method === "PATCH") {
                const FacultyId = currentUser?.id || "t1";
                const submissionId = FacultyAssignmentReviewMatch[1];
                const submissions = readStoredMockAssignmentSubmissions();
                const submissionIndex = submissions.findIndex((item) => item.id === submissionId);

                if (submissionIndex === -1) {
                    return makeResponse({ message: "Assignment submission not found" }, 404);
                }

                const submission = submissions[submissionIndex];
                const assignment = readStoredMockBatchContents().find((item) => item.id === submission.assignmentId);
                const batch = assignment ? BATCHES.find((item) => item.id === assignment.batchId) : null;

                if (!assignment || !batch || batch.FacultyId !== FacultyId) {
                    return makeResponse({ message: "You do not have access to review this submission" }, 403);
                }

                const maxMarks = normalizeMockMaxMarks(assignment.maxMarks);
                const normalizedGrade = body.grade === "" || body.grade === null || body.grade === undefined ? null : Number(body.grade);

                if (normalizedGrade !== null && (!Number.isFinite(normalizedGrade) || normalizedGrade < 0 || normalizedGrade > maxMarks)) {
                    return makeResponse({ message: `grade must be between 0 and ${maxMarks}` }, 400);
                }

                const nextSubmission: MockAssignmentSubmission = {
                    ...submission,
                    status: "REVIEWED",
                    grade: normalizedGrade,
                    feedback: typeof body.feedback === "string" ? body.feedback.trim() : "",
                };

                const nextSubmissions = [...submissions];
                nextSubmissions[submissionIndex] = nextSubmission;
                writeStoredMockAssignmentSubmissions(nextSubmissions);

                const student = getMockUserById(submission.studentId);

                return makeResponse({
                    message: "Submission reviewed successfully",
                    submission: {
                        id: nextSubmission.id,
                        grade: nextSubmission.grade,
                        feedback: nextSubmission.feedback,
                        status: nextSubmission.status,
                        submittedAt: nextSubmission.submittedAt,
                        studentName: student?.name || "Student",
                        maxMarks,
                    },
                });
            }

            if (path === "/Faculty/dashboard" && method === "GET") {
                const FacultyId = currentUser?.id || "t1";
                const FacultyBatches = BATCHES
                    .filter((b) => b.FacultyId === FacultyId)
                    .map((b) => ({ ...b, course: COURSES.find((c) => c.id === b.courseId) }));
                const FacultyBatchIds = FacultyBatches.map((batch) => batch.id);
                const totalContents = readStoredMockBatchContents().filter((item) => FacultyBatchIds.includes(item.batchId)).length;

                return makeResponse({
                    summary: {
                        totalBatches: FacultyBatches.length,
                        totalStudents: ENROLLMENTS.filter((e) => FacultyBatches.some((b) => b.id === e.batchId)).length,
                        totalTests: 0,
                        totalContents,
                        pendingAssignmentReviews: 0,
                    },
                    batches: FacultyBatches,
                });
            }

            if (path === "/student/dashboard" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const enrollments = ENROLLMENTS.filter((e) => e.studentId === studentId).map((e) => ({
                    ...e,
                    progressPercent: e.progress,
                    batch: BATCHES.find((b) => b.id === e.batchId),
                    course: COURSES.find((c) => c.id === e.courseId),
                }));
                const batchIds = enrollments.map((e) => e.batchId);
                const announcements = ANNOUNCEMENTS.filter((a) => batchIds.includes(a.batchId));
                const attendancePercentage = enrollments.length
                    ? Math.round(enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / enrollments.length)
                    : 0;

                return makeResponse({
                    summary: {
                        enrolledBatches: enrollments.length,
                        attendancePercentage,
                        averageTestScore: 0,
                        pendingAssignments: 0,
                    },
                    enrollments,
                    announcements,
                });
            }

            if (path === "/student/available-batches" && method === "GET") {
                const batches = BATCHES.map((b) => ({ ...b, course: COURSES.find((c) => c.id === b.courseId) }));
                return makeResponse(batches);
            }

            if (path === "/student/self-enroll" && method === "POST") {
                return makeResponse({ success: true, message: "Self enrollment successful (frontend mode)." });
            }

            if (path === "/student/my-learning" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const enrollments = ENROLLMENTS.filter((e) => e.studentId === studentId).map((e) => ({
                    ...e,
                    progressPercent: e.progress,
                    batch: BATCHES.find((b) => b.id === e.batchId),
                    course: COURSES.find((c) => c.id === e.courseId),
                }));
                return makeResponse(enrollments);
            }

            if (path === "/student/assignments" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const submissions = readStoredMockAssignmentSubmissions();
                const studentBatchIds = ENROLLMENTS.filter((item) => item.studentId === studentId).map((item) => item.batchId);
                const studentAssignments = readStoredMockBatchContents()
                    .filter((item) => String(item.type).toUpperCase() === "ASSIGNMENT" && studentBatchIds.includes(item.batchId))
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map((assignment) => {
                        const batch = BATCHES.find((item) => item.id === assignment.batchId);
                        const course = COURSES.find((item) => item.id === batch?.courseId);
                        const submission = submissions.find((item) => item.assignmentId === assignment.id && item.studentId === studentId);

                        return {
                            id: assignment.id,
                            title: assignment.title,
                            description: assignment.description || "",
                            batchId: assignment.batchId,
                            batchName: batch?.name || "Batch",
                            courseName: course?.title || "Course",
                            maxMarks: normalizeMockMaxMarks(assignment.maxMarks),
                            assignmentFileUrl: assignment.contentUrl,
                            uploadedAt: assignment.createdAt,
                            submission: submission ? {
                                id: submission.id,
                                fileUrl: submission.fileUrl,
                                fileName: submission.fileName,
                                notes: submission.notes || "",
                                status: submission.status,
                                grade: submission.grade ?? null,
                                feedback: submission.feedback ?? null,
                                submittedAt: submission.submittedAt,
                            } : null,
                        };
                    });

                return makeResponse(studentAssignments);
            }

            const StudentAssignmentSubmitMatch = path.match(/^\/student\/assignments\/([^/]+)\/submit$/);
            if (StudentAssignmentSubmitMatch && method === "POST") {
                const studentId = currentUser?.id || "u1";
                const assignmentId = StudentAssignmentSubmitMatch[1];
                const assignment = readStoredMockBatchContents().find((item) => item.id === assignmentId && String(item.type).toUpperCase() === "ASSIGNMENT");

                if (!assignment) {
                    return makeResponse({ message: "Assignment not found" }, 404);
                }

                const enrollment = ENROLLMENTS.find((item) => item.studentId === studentId && item.batchId === assignment.batchId);
                if (!enrollment) {
                    return makeResponse({ message: "You are not enrolled in this batch" }, 403);
                }

                const fileName = String(body.fileName || "").trim();
                const fileData = String(body.fileData || "").trim();
                if (!fileName || !fileData) {
                    return makeResponse({ message: "Assignment file is required" }, 400);
                }

                const existingSubmissions = readStoredMockAssignmentSubmissions();
                if (existingSubmissions.some((item) => item.assignmentId === assignmentId && item.studentId === studentId)) {
                    return makeResponse({ message: "Assignment already submitted" }, 409);
                }

                const nextSubmission: MockAssignmentSubmission = {
                    id: `mock-assignment-submission-${Date.now()}`,
                    studentId,
                    assignmentId,
                    batchId: assignment.batchId,
                    fileUrl: resolveMockUploadedFileUrl(fileData, fileName),
                    fileName,
                    notes: typeof body.notes === "string" ? body.notes.trim() : "",
                    status: "SUBMITTED",
                    grade: null,
                    feedback: "",
                    submittedAt: new Date().toISOString(),
                };

                writeStoredMockAssignmentSubmissions([...existingSubmissions, nextSubmission]);

                return makeResponse({
                    id: nextSubmission.id,
                    fileUrl: nextSubmission.fileUrl,
                    fileName: nextSubmission.fileName,
                    notes: nextSubmission.notes,
                    status: nextSubmission.status,
                    grade: nextSubmission.grade,
                    feedback: nextSubmission.feedback,
                    submittedAt: nextSubmission.submittedAt,
                }, 201);
            }

            if (path === "/student/attendance" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const attendance = ENROLLMENTS.filter((e) => e.studentId === studentId).reduce((acc, enrollment) => {
                    const batch = BATCHES.find((b) => b.id === enrollment.batchId);
                    const present = enrollment.progress >= 80 ? 9 : enrollment.progress >= 50 ? 7 : 5;
                    const total = 10;
                    acc[batch?.name || enrollment.batchId] = {
                        total,
                        present,
                        absent: total - present,
                        late: 0,
                        records: [],
                    };
                    return acc;
                }, {} as Record<string, unknown>);
                return makeResponse({ success: true, data: attendance });
            }

            if (path === "/student/announcements" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const batchIds = ENROLLMENTS.filter((e) => e.studentId === studentId).map((e) => e.batchId);
                const announcements = ANNOUNCEMENTS.filter((a) => batchIds.includes(a.batchId));
                return makeResponse({ success: true, data: announcements });
            }

            if (path === "/student/notifications" && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const inbox = readStoredMockNotificationRecipients()
                    .filter((item) => item.userId === studentId)
                    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                    .map(buildMockNotificationRecipientPayload)
                    .filter(Boolean);
                return makeResponse(inbox);
            }

            if (path.startsWith("/student/notifications/") && path.endsWith("/read") && method === "PATCH") {
                const notificationId = path.replace("/student/notifications/", "").replace("/read", "");
                const studentId = currentUser?.id || "u1";
                const recipients = readStoredMockNotificationRecipients();
                const recipientIndex = recipients.findIndex((item) => item.notificationId === notificationId && item.userId === studentId);

                if (recipientIndex === -1) {
                    return makeResponse({ message: "Notification not found" }, 404);
                }

                recipients[recipientIndex] = {
                    ...recipients[recipientIndex],
                    readAt: new Date().toISOString(),
                };
                writeStoredMockNotificationRecipients(recipients);
                return makeResponse({ message: "Notification marked as read" });
            }

            if (path.startsWith("/student/batch-resources") && method === "GET") {
                const studentId = currentUser?.id || "u1";
                const requestedType = String(searchParams.get("type") || "").trim().toUpperCase();
                const studentEnrollments = ENROLLMENTS.filter((item) => item.studentId === studentId);
                const studentBatchIds = studentEnrollments.map((item) => item.batchId);
                const filteredMockContents = readStoredMockBatchContents().filter((item) => (
                    studentBatchIds.includes(item.batchId) &&
                    (!requestedType || item.type === requestedType)
                ));

                const batchRouteMatch = path.match(/^\/student\/batch-resources\/([^/]+)$/);
                if (batchRouteMatch) {
                    const batchId = batchRouteMatch[1];
                    if (!studentBatchIds.includes(batchId)) {
                        return makeResponse({ message: "Access denied: Enroll in this batch first" }, 403);
                    }

                    const batchContents = filteredMockContents
                        .filter((item) => item.batchId === batchId)
                        .map(mapMockContentForStudent);

                    return makeResponse({
                        success: true,
                        data: batchContents,
                        contents: batchContents,
                        tests: [],
                    });
                }

                return makeResponse({
                    success: true,
                    data: filteredMockContents.map(mapMockContentForStudent),
                });
            }

            if (path.startsWith("/admin/users") && method === "GET") {
                const users = allUsers.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: toPortalRole(u.role),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                }));
                return makeResponse(users);
            }

            if (path === "/admin/dashboard" && method === "GET") {
                return makeResponse({
                    students: allUsers.filter((u) => toPortalRole(u.role) === "STUDENT").length,
                    Faculty: allUsers.filter((u) => toPortalRole(u.role) === "Faculty").length,
                    courses: COURSES.length,
                    batches: BATCHES.length,
                    revenue: 0,
                    recentStudents: allUsers
                        .filter((u) => toPortalRole(u.role) === "STUDENT")
                        .map((u) => ({ ...u, isActive: true, createdAt: new Date().toISOString() }))
                        .slice(0, 5),
                });
            }

            if (path === "/admin/system-stats" && method === "GET") {
                return makeResponse({
                    stats: {
                        totalUsers: allUsers.length,
                        totalStudents: allUsers.filter((u) => toPortalRole(u.role) === "STUDENT").length,
                        totalFaculty: allUsers.filter((u) => toPortalRole(u.role) === "Faculty").length,
                        totalBatches: BATCHES.length,
                    },
                });
            }

            if (path === "/admin/batches" && method === "GET") {
                return makeResponse(BATCHES);
            }

            if (path.startsWith("/admin") || path.startsWith("/cms")) {
                return makeResponse({ success: true, data: [] });
            }

            return makeResponse({ success: true, message: "Mock response (frontend mode)." });
        };
    }, []);

    if (isAppPath || isAppHost) {
        return <main className="portal-font">{children}</main>;
    }

    // Still detecting hostname (first render) — don't flash header/footer
    if (isAppHost === null) {
        return <main>{children}</main>;
    }

    return (
        <>
            <Header />
            <main>{children}</main>
            <Footer />
            <WhatsAppButton />
            <ScrollToTop />
        </>
    );
}
