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

const MOCK_USERS_KEY = "itroots_mock_users";
const MOCK_BATCH_CONTENTS_KEY = "itroots_mock_batch_contents";
const MOCK_SHARED_VIDEO_CONTENTS_COOKIE = "itroots_mock_shared_video_contents";
const MOCK_ASSIGNMENT_SUBMISSIONS_KEY = "itroots_mock_assignment_submissions";
const SESSION_KEY = "itroots_session";

function toPortalRole(role: string) {
    if (role === "Faculty" || role === "Faculty") return "Faculty";
    if (role === "SUPER_ADMIN" || role === "admin") return "SUPER_ADMIN";
    if (role === "CMS_MANAGER" || role === "cms") return "CMS_MANAGER";
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
    const isAppPath = pathname?.startsWith("/lms") || pathname?.startsWith("/admin");

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
            const allUsers: MockApiUser[] = [
                ...USERS.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    password: u.password,
                    role: u.role,
                })),
                ...readStoredMockUsers(),
            ];
            const currentUser = (() => {
                try {
                    const saved = localStorage.getItem(SESSION_KEY);
                    return saved ? JSON.parse(saved) : null;
                } catch {
                    return null;
                }
            })();

            let body: Record<string, unknown> = {};
            if (typeof init?.body === "string") {
                try {
                    body = JSON.parse(init.body);
                } catch {
                    body = {};
                }
            }

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
        return <main>{children}</main>;
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
