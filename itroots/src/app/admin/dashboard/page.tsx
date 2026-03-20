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
    CaretDown,
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

const getStatusClass = (status?: string) => {
    const normalized = (status || "DRAFT").toUpperCase();
    if (normalized === "ACTIVE") return `${styles.statusBadge} ${styles.statusActive}`;
    if (normalized === "ARCHIVED") return `${styles.statusBadge} ${styles.statusArchived}`;
    return `${styles.statusBadge} ${styles.statusDraft}`;
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
                    <div className={styles.section} style={{ gridColumn: "1 / -1" }}>

                        <div className={styles.controlsGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", padding: "1.5rem" }}>
                            <Link href="/admin/students" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                                <Users size={48} color="#0881ec" />
                                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Student Records</span>
                            </Link>
                            <Link href="/admin/teachers" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                                <Chalkboard size={48} color="#0881ec" />
                                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Faculty Management</span>
                            </Link>
                            <Link href="/admin/batches" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                                <Calendar size={48} color="#0881ec" />
                                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Batch Scheduling</span>
                            </Link>
                        </div>
                    </div>

                    <div className={styles.section} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.sectionHeader}>
                            <span>Batch Schedule</span>
                            <Link href="/admin/batches" style={{ color: "#0881ec", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
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
                                            <td colSpan={6} className={styles.emptyTableCell}>No batches available yet.</td>
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

                    <div className={styles.section} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.sectionHeader}>Recent Student Registrations</div>
                        <div style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
                            {dashboard.recentStudents.length === 0 ? (
                                <div style={{ color: "#64748b" }}>No student registrations found yet.</div>
                            ) : (
                                dashboard.recentStudents.map((student) => (
                                    <div key={student.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem 1rem", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{student.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{student.email}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ color: "#475569", fontSize: "0.85rem" }}>{new Date(student.createdAt).toLocaleDateString("en-IN")}</div>
                                            {student.isActive ? (
                                                <div style={{ color: "#059669", fontSize: "0.8rem", fontWeight: 700 }}>
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
