"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChartLineUp, CheckCircle, GraduationCap, CalendarCheck, BookOpen } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./progress.module.css";

export default function StudentProgressPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        Promise.all([
            fetch(ENDPOINTS.STUDENT.MY_LEARNING, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()),
            fetch(ENDPOINTS.STUDENT.ATTENDANCE, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()),
        ]).then(([learningData, attData]) => {
            if (Array.isArray(learningData)) setEnrollments(learningData);
            if (attData.success) setAttendanceData(attData.data);
            setLoadingData(false);
        }).catch(err => {
            console.error("Failed to fetch analytics:", err);
            setLoadingData(false);
        });
    }, [token]);

    if (isLoading || !user) return null;

    const attBatches = Object.values(attendanceData);
    const avgAtt = attBatches.length
        ? Math.round(attBatches.reduce((s: number, b: any) => s + (b.total > 0 ? (b.present / b.total) * 100 : 0), 0) / attBatches.length)
        : null;

    return (
        <LMSShell pageTitle="My Analytics">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Learning Analytics</div>
                        <div className={styles.bannerSub}>Track your academic progress.</div>
                    </div>
                    <ChartLineUp size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.blue}`}>
                            <GraduationCap size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "—" : enrollments.length}</div>
                            <div className={styles.statLabel}>Enrolled Batches</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.green}`}>
                            <CalendarCheck size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "—" : avgAtt !== null ? `${avgAtt}%` : "N/A"}</div>
                            <div className={styles.statLabel}>Avg. Attendance</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.orange}`}>
                            <CheckCircle size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>—</div>
                            <div className={styles.statLabel}>Assignments Done</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.purple}`}>
                            <ChartLineUp size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>—</div>
                            <div className={styles.statLabel}>Avg. Test Score</div>
                        </div>
                    </div>
                </div>

                {/* Per-Batch Progress */}
                {enrollments.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Batch Progress</div>
                        <div className={styles.batchProgressList}>
                            {enrollments.map((item: any) => (
                                <div key={item.id} className={styles.batchProgressItem}>
                                    <div className={styles.batchProgressHeader}>
                                        <div className={styles.batchAvatar}>
                                            <BookOpen size={16} weight="duotone" />
                                        </div>
                                        <div className={styles.batchProgressInfo}>
                                            <div className={styles.batchProgressName}>{item.batch?.name}</div>
                                            <div className={styles.batchProgressCourse}>{item.batch?.course?.title}</div>
                                        </div>
                                        <div className={styles.batchProgressPct}>{item.progressPercent || 0}%</div>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${item.progressPercent || 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </LMSShell>
    );
}
