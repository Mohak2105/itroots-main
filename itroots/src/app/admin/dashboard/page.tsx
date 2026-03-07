"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Users,
    ChalkboardTeacher,
    Calendar,
    CreditCard,
    ArrowRight,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./admin-dashboard.module.css";

type DashboardData = {
    students: number;
    teachers: number;
    courses: number;
    batches: number;
    revenue: number;
    recentStudents: Array<{
        id: string;
        name: string;
        email: string;
        createdAt: string;
        isActive: boolean;
    }>;
};

export default function AdminDashboard() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<DashboardData>({
        students: 0,
        teachers: 0,
        courses: 0,
        batches: 0,
        revenue: 0,
        recentStudents: [],
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
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
            <div className={styles.welcome}>
                <div>
                    <h2>Admin Dashboard</h2>
                    <p>Database-backed overview of students, teachers, courses, batches, and onboarding activity.</p>
                </div>
            </div>

            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Registered Students</span>
                    <span className={styles.statValue}>{dashboard.students}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Expert Instructors</span>
                    <span className={styles.statValue}>{dashboard.teachers}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Published Courses</span>
                    <span className={styles.statValue}>{dashboard.courses}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Active Batches</span>
                    <span className={styles.statValue}>{dashboard.batches}</span>
                </div>
            </section>

            <div className={styles.mainGrid}>
                <div className={styles.section} style={{ gridColumn: "1 / -1" }}>
                    <div className={styles.sectionHeader}>Operational Control Hub</div>
                    <div className={styles.controlsGrid} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", padding: "1.5rem" }}>
                        <Link href="/students" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                            <Users size={48} color="#0881ec" />
                            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Student Records</span>
                        </Link>
                        <Link href="/teachers" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                            <ChalkboardTeacher size={48} color="#0881ec" />
                            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Faculty Management</span>
                        </Link>
                        <Link href="/batches" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                            <Calendar size={48} color="#0881ec" />
                            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Batch Scheduling</span>
                        </Link>
                        <Link href="/payments" className={styles.controlCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", background: "#f8fafc", borderRadius: "16px", textDecoration: "none" }}>
                            <CreditCard size={48} color="#0881ec" />
                            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>Finances & Fees</span>
                        </Link>
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

            <div className={styles.ctaSection}>
                <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Manage Portal Global Settings</h3>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Update pricing, announcements, and operational configuration from one place.</p>
                </div>
                <Link href="/settings" style={{ background: "#0881ec", color: "#fff", padding: "0.8rem 1.5rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    Open System Config <ArrowRight size={18} />
                </Link>
            </div>
        </LMSShell>
    );
}

