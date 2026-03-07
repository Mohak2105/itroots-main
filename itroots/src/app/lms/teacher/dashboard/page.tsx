"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChalkboardTeacher, Video, UsersThree, ArrowRight, CalendarDots, Link as LinkIcon } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./teacher-dashboard.module.css";
import Link from "next/link";

type DashboardData = {
    summary: {
        totalBatches: number;
        totalStudents: number;
        totalTests: number;
        totalContents: number;
        pendingAssignmentReviews: number;
        upcomingLiveClasses: number;
    };
    batches: any[];
    liveClasses: any[];
};

export default function TeacherDashboard() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<DashboardData>({
        summary: {
            totalBatches: 0,
            totalStudents: 0,
            totalTests: 0,
            totalContents: 0,
            pendingAssignmentReviews: 0,
            upcomingLiveClasses: 0,
        },
        batches: [],
        liveClasses: [],
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "TEACHER")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.TEACHER.DASHBOARD, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.summary) setDashboard(data);
            })
            .catch(console.error);
    }, [token]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Course Overview">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Course Overview</div>
                        <div className={styles.bannerSub}>Manage your assigned batches, content, tests, and live classes from one place.</div>
                    </div>
                    <ChalkboardTeacher size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "#e0f2fe" }}><ChalkboardTeacher size={24} color="#0ea5e9" /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalBatches}</span>
                            <span className={styles.statLabel}>Active Batches</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "#dcfce7" }}><UsersThree size={24} color="#16a34a" /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalStudents}</span>
                            <span className={styles.statLabel}>Students Assigned</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "#fef3c7" }}><Video size={24} color="#d97706" /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.upcomingLiveClasses}</span>
                            <span className={styles.statLabel}>Upcoming Live Classes</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "#f3e8ff" }}><CalendarDots size={24} color="#7c3aed" /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalContents}</span>
                            <span className={styles.statLabel}>Uploaded Materials</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionHeader}>
                    <h3>Upcoming Live Classes</h3>
                </div>

                <div className={styles.batchGrid}>
                    {dashboard.liveClasses.length === 0 ? (
                        <div className={styles.emptyState}>No live classes scheduled yet. Use the calendar to create one.</div>
                    ) : (
                        dashboard.liveClasses.map((liveClass) => (
                            <div key={liveClass.id} className={styles.batchCard}>
                                <div className={styles.batchHeader}>
                                    <div className={styles.batchInfo}>
                                        <h4>{liveClass.title}</h4>
                                        <span className={styles.courseTag}>{liveClass.course?.title}</span>
                                    </div>
                                    <div className={styles.scheduleBadge}>{new Date(liveClass.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                                    <div>{liveClass.batch?.name}</div>
                                    <div>{new Date(liveClass.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div>
                                </div>
                                <div className={styles.batchFooter} style={{ display: "flex", gap: "0.75rem" }}>
                                    <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className={styles.manageBtn} style={{ flex: 1 }}>
                                        Join Class <LinkIcon size={16} />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.sectionHeader}>
                    <h3>My Batches</h3>
                </div>

                <div className={styles.batchGrid}>
                    {dashboard.batches.length === 0 ? (
                        <div className={styles.emptyState}>No batches assigned yet. Contact Admin for details.</div>
                    ) : (
                        dashboard.batches.map((batch) => (
                            <div key={batch.id} className={styles.batchCard}>
                                <div className={styles.batchHeader}>
                                    <div className={styles.batchInfo}>
                                        <h4>{batch.name}</h4>
                                        <span className={styles.courseTag}>{batch.course?.title}</span>
                                    </div>
                                    <div className={styles.scheduleBadge}>{batch.schedule}</div>
                                </div>
                                <div className={styles.batchFooter}>
                                    <Link href={`/lms/teacher/batches/${batch.id}`} className={styles.manageBtn}>
                                        Manage Batch <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
