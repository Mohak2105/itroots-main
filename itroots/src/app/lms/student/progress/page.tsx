"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChartLineUp, CheckCircle, GraduationCap, CalendarCheck } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./progress.module.css";

export default function StudentProgressPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
    const [averageTestScore, setAverageTestScore] = useState(0);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        Promise.all([
            fetch(ENDPOINTS.STUDENT.MY_LEARNING, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
            fetch(ENDPOINTS.STUDENT.ATTENDANCE, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
            fetch(ENDPOINTS.STUDENT.DASHBOARD, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        ]).then(([learningData, attData, dashboardData]) => {
            if (Array.isArray(learningData)) setEnrollments(learningData);
            if (attData?.success) setAttendanceData(attData.data);
            if (dashboardData?.summary?.averageTestScore !== undefined) {
                setAverageTestScore(Number(dashboardData.summary.averageTestScore) || 0);
            }
            setLoadingData(false);
        }).catch((err) => {
            console.error("Failed to fetch analytics:", err);
            setLoadingData(false);
        });
    }, [token]);

    if (isLoading || !user) return null;

    const attBatches = Object.values(attendanceData);
    const avgAtt = attBatches.length
        ? Math.round(attBatches.reduce((sum: number, batch: any) => sum + (batch.total > 0 ? (batch.present / batch.total) * 100 : 0), 0) / attBatches.length)
        : null;

    const avgProgress = enrollments.length
        ? Math.round(enrollments.reduce((sum: number, enrollment: any) => sum + Number(enrollment.progressPercent || 0), 0) / enrollments.length)
        : 0;

    return (
        <LMSShell pageTitle="My Analytics">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Learning Analytics</div>
                        <div className={styles.bannerSub}>Track your academic progress.</div>
                    </div>
                    <ChartLineUp size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.blue}`}>
                            <GraduationCap size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "-" : enrollments.length}</div>
                            <div className={styles.statLabel}>Enrolled Batches</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.green}`}>
                            <CalendarCheck size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "-" : avgAtt !== null ? `${avgAtt}%` : "N/A"}</div>
                            <div className={styles.statLabel}>Avg. Attendance</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.orange}`}>
                            <CheckCircle size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "-" : `${avgProgress}%`}</div>
                            <div className={styles.statLabel}>Learning Progress</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.purple}`}>
                            <ChartLineUp size={22} weight="duotone" />
                        </div>
                        <div>
                            <div className={styles.statValue}>{loadingData ? "-" : `${averageTestScore}%`}</div>
                            <div className={styles.statLabel}>Avg. Test Score</div>
                        </div>
                    </div>
                </div>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Batch Progress</h3>
                    {loadingData ? (
                        <p>Loading progress...</p>
                    ) : enrollments.length === 0 ? (
                        <p>No enrolled batches yet.</p>
                    ) : (
                        <div className={styles.batchProgressList}>
                            {enrollments.map((enrollment) => {
                                const progress = Number(enrollment.progressPercent || 0);
                                return (
                                    <div key={enrollment.id} className={styles.batchProgressItem}>
                                        <div className={styles.batchProgressHeader}>
                                            <div className={styles.batchAvatar}>
                                                {(enrollment.batch?.name || "B").charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.batchProgressInfo}>
                                                <div className={styles.batchProgressName}>{enrollment.batch?.name || "Batch"}</div>
                                                <div className={styles.batchProgressCourse}>{enrollment.batch?.course?.title || "Course"}</div>
                                            </div>
                                            <div className={styles.batchProgressPct}>{progress}%</div>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </LMSShell>
    );
}
