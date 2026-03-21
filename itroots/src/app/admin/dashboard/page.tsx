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
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./admin-dashboard.module.css";

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

export default function AdminDashboard() {
    const { user, isLoading, token } = useLMSAuth();
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
                        <span className={styles.statLabel}>Active Students</span>
                        <span className={styles.statValue}>{dashboard.students}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Active Faculty</span>
                        <span className={styles.statValue}>{dashboard.Faculty}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Active Courses</span>
                        <span className={styles.statValue}>{dashboard.courses}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Active Batches</span>
                        <span className={styles.statValue}>{dashboard.batches}</span>
                    </div>
                </section>

                <div className={styles.mainGrid}>
                    <div className={`${styles.section} ${styles.fullWidthSection}`}>
                        <div className={styles.controlsGrid}>
                            <Link href="/admin/students" className={styles.controlCard}>
                                <Users size={48} color="#0881ec" />
                                <span className={styles.controlCardLabel}>Student Records</span>
                            </Link>
                            <Link href="/admin/teachers" className={styles.controlCard}>
                                <Chalkboard size={48} color="#0881ec" />
                                <span className={styles.controlCardLabel}>Faculty Management</span>
                            </Link>
                            <Link href="/admin/batches" className={styles.controlCard}>
                                <Calendar size={48} color="#0881ec" />
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
                                                <td>{batch.Faculty?.name || "Unassigned"}</td>
                                                
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
                                            <div className={styles.recentStudentName}>{student.name}</div>
                                            <div className={styles.recentStudentEmail}>{student.email}</div>
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
