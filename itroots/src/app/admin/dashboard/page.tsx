"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Users,
    Chalkboard,
    Calendar,
    Student,
    ChalkboardTeacher,
    BookOpenText,
    CalendarDots,
} from "@/components/icons/lucide-phosphor";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import { createImpersonationTransfer } from "@/utils/impersonation";
import styles from "./admin-dashboard.module.css";
import toast from "react-hot-toast";

type DashboardData = {
    students: number;
    Faculty: number;
    courses: number;
    batches: number;
    certificates: number;
    revenue: number;
    recentStudents: Array<{
        id: string;
        name: string;
        email: string;
        profileImage?: string | null;
        createdAt: string;
        isActive: boolean;
    }>;
    allCourses: Array<{
        id: string;
        title: string;
        category?: string;
        duration?: string;
        status?: string;
        instructor?: {
            id: string;
            name: string;
        } | null;
    }>;
    allBatches: Array<{
        id: string;
        name: string;
        schedule?: string;
        startDate?: string;
        endDate?: string;
        studentCount: number;
        course?: {
            id: string;
            title: string;
        } | null;
        Faculty?: {
            id: string;
            name: string;
        } | null;
    }>;
};


const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const resolveProfileImageUrl = (filePath?: string | null) => {
    if (!filePath) {
        return "";
    }

    if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("data:")) {
        return filePath;
    }

    return `${API_ORIGIN}${filePath}`;
};

export default function AdminDashboard() {
    const { user, isLoading, token, impersonate } = useLMSAuth();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<DashboardData>({
        students: 0,
        Faculty: 0,
        courses: 0,
        batches: 0,
        certificates: 0,
        revenue: 0,
        recentStudents: [],
        allCourses: [],
        allBatches: [],
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!token) return;
            try {
                const res = await fetch(ENDPOINTS.ADMIN.DASHBOARD, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) {
                    setDashboard(data);
                }
            } catch (err) {
                console.error("Dashboard fetch failed:", err);
            }
        };

        void fetchDashboard();
    }, [token]);

    const handleImpersonate = async (id: string, targetPath: string) => {
        if (!token) return;

        const shouldOpenNewTab = targetPath.startsWith("/student/") || targetPath.startsWith("/faculty/");
        const isFacultyDashboard = targetPath.startsWith("/faculty/");
        const loadingLabel = isFacultyDashboard ? "faculty dashboard" : "student dashboard";
        const targetTab = shouldOpenNewTab && typeof window !== "undefined" ? window.open("", "_blank") : null;

        if (targetTab) {
            targetTab.document.write(`<title>Opening ${loadingLabel}...</title><p style="font-family: sans-serif; padding: 24px;">Opening ${loadingLabel}...</p>`);
        }

        try {
            const res = await fetch(ENDPOINTS.ADMIN.IMPERSONATE(id), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Impersonation failed");
            }

            if (shouldOpenNewTab) {
                const bridgeKey = createImpersonationTransfer(data.user, data.token);
                if (!bridgeKey) {
                    throw new Error(`Unable to open ${loadingLabel}`);
                }

                const targetUrl = `${targetPath}?impersonationKey=${encodeURIComponent(bridgeKey)}`;
                if (targetTab && !targetTab.closed) {
                    targetTab.location.href = targetUrl;
                } else if (typeof window !== "undefined") {
                    window.open(targetUrl, "_blank");
                }

                toast.success(`Opened ${data.user.name}'s dashboard in a new tab`);
                return;
            }

            impersonate(data.user, data.token);
            toast.success(`Logged in as ${data.user.name}`);
            router.push(targetPath);
        } catch (err) {
            if (targetTab && !targetTab.closed) {
                targetTab.close();
            }
            console.error("Impersonation error:", err);
            toast.error(err instanceof Error ? err.message : "Impersonation failed");
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Admin System Intelligence">
            <div className={styles.pageStack}>
                <div className={styles.welcome}>
                    <div>
                        <h2>Admin Dashboard</h2>
                        <p>Overview of Students, Faculty, Courses, Batches.</p>
                    </div>
                </div>

                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={`${styles.statIconWrap} ${styles.statIconStudents}`}>
                            <Student size={28} weight="duotone" />
                        </span>
                        <span className={styles.statLabel}>Active Students</span>
                        <span className={styles.statValue}>{dashboard.students}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statIconWrap} ${styles.statIconFaculty}`}>
                            <ChalkboardTeacher size={28} weight="duotone" />
                        </span>
                        <span className={styles.statLabel}>Active Faculty</span>
                        <span className={styles.statValue}>{dashboard.Faculty}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statIconWrap} ${styles.statIconCourses}`}>
                            <BookOpenText size={28} weight="duotone" />
                        </span>
                        <span className={styles.statLabel}>Active Courses</span>
                        <span className={styles.statValue}>{dashboard.courses}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statIconWrap} ${styles.statIconBatchesStat}`}>
                            <CalendarDots size={28} weight="duotone" />
                        </span>
                        <span className={styles.statLabel}>Active Batches</span>
                        <span className={styles.statValue}>{dashboard.batches}</span>
                    </div>
                </section>

                <div className={styles.mainGrid}>
                    <div className={`${styles.section} ${styles.fullWidthSection}`}>
                        <div className={styles.controlsGrid}>
                            <Link href="/admin/students" className={styles.controlCard}>
                                <span className={`${styles.controlIconWrap} ${styles.controlIconStudents}`}>
                                    <Users size={44} weight="duotone" />
                                </span>
                                <span className={styles.controlCardLabel}>Student Records</span>
                            </Link>
                            <Link href="/admin/teachers" className={styles.controlCard}>
                                <span className={`${styles.controlIconWrap} ${styles.controlIconFaculty}`}>
                                    <Chalkboard size={44} weight="duotone" />
                                </span>
                                <span className={styles.controlCardLabel}>Faculty Management</span>
                            </Link>
                            <Link href="/admin/batches" className={styles.controlCard}>
                                <span className={`${styles.controlIconWrap} ${styles.controlIconBatches}`}>
                                    <Calendar size={44} weight="duotone" />
                                </span>
                                <span className={styles.controlCardLabel}>Batch Scheduling</span>
                            </Link>
                        </div>
                    </div>

                    <div className={`${styles.section} ${styles.fullWidthSection}`}>
                        <div className={styles.sectionHeader}>
                            <span>Batch Schedule</span>
                            <Link href="/admin/batches" className={styles.sectionLink}>
                                Open All Batches
                            </Link>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Batch</th>
                                        <th>Course</th>
                                        <th>Faculty</th>
                                        <th>Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard.allBatches.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className={styles.emptyTableCell}>No batches available yet.</td>
                                        </tr>
                                    ) : (
                                        dashboard.allBatches.map((batch) => (
                                            <tr key={batch.id}>
                                                <td>
                                                    <Link href="/admin/batches" className={styles.tableLink}>{batch.name}</Link>
                                                </td>
                                                <td>{batch.course?.title || "Unassigned"}</td>
                                                <td>
                                                    {batch.Faculty ? (
                                                        <a
                                                            href="#"
                                                            className={styles.tableLink}
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                void handleImpersonate(batch.Faculty!.id, "/faculty/dashboard");
                                                            }}
                                                        >
                                                            {batch.Faculty.name}
                                                        </a>
                                                    ) : "Unassigned"}
                                                </td>
                                                
                                                <td>{batch.studentCount}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={`${styles.section} ${styles.fullWidthSection}`}>
                        <div className={styles.sectionHeader}>Recent Student Registrations</div>
                        <div className={styles.recentStudentsList}>
                            {dashboard.recentStudents.length === 0 ? (
                                <div className={styles.emptyStateText}>No student registrations found yet.</div>
                            ) : (
                                dashboard.recentStudents.map((student) => (
                                    <div key={student.id} className={styles.recentStudentRow}>
                                        <div className={styles.recentStudentInfo}>
                                            <div className={`${styles.recentStudentAvatar} ${student.profileImage ? styles.recentStudentAvatarPhoto : ""}`}>
                                                {student.profileImage ? (
                                                    <img
                                                        src={resolveProfileImageUrl(student.profileImage)}
                                                        alt={`${student.name} profile`}
                                                        className={styles.recentStudentAvatarImage}
                                                    />
                                                ) : (
                                                    getInitials(student.name)
                                                )}
                                            </div>
                                            <div className={styles.recentStudentCopy}>
                                            <a
                                                href="#"
                                                className={styles.recentStudentName}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    void handleImpersonate(student.id, "/student/dashboard");
                                                }}
                                            >
                                                {student.name}
                                            </a>
                                            <div className={styles.recentStudentEmail}>{student.email}</div>
                                            </div>
                                        </div>
                                        <div className={styles.recentStudentMeta}>
                                            <div className={styles.recentStudentDate}>{formatDate(student.createdAt)}</div>
                                            {student.isActive ? (
                                                <div className={styles.recentStudentStatus}>
                                                    Active
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
