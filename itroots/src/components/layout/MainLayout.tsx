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

const MOCK_USERS_KEY = "itroots_mock_users";
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

            const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();
            const path = url.replace(API_BASE_URL, "");
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
                return makeResponse({
                    success: true,
                    data: {
                        id: batchId,
                        enrollments,
                        contents: [],
                        tests: [],
                    },
                });
            }

            if (path === "/Faculty/tests" && method === "POST") {
                return makeResponse({ success: true, message: "Test created (frontend mode)." });
            }

            if (path === "/Faculty/batch-content" && method === "POST") {
                return makeResponse({ success: true, message: "Content added (frontend mode)." });
            }

            if (path.startsWith("/Faculty/test-results/") && method === "GET") {
                return makeResponse({ success: true, data: [] });
            }

            if (path === "/Faculty/dashboard" && method === "GET") {
                const FacultyId = currentUser?.id || "t1";
                const FacultyBatches = BATCHES
                    .filter((b) => b.FacultyId === FacultyId)
                    .map((b) => ({ ...b, course: COURSES.find((c) => c.id === b.courseId) }));

                return makeResponse({
                    summary: {
                        totalBatches: FacultyBatches.length,
                        totalStudents: ENROLLMENTS.filter((e) => FacultyBatches.some((b) => b.id === e.batchId)).length,
                        totalTests: 0,
                        totalContents: 0,
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
                return makeResponse({ success: true, data: [] });
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




