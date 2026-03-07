"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { CalendarCheck, WarningCircle } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./attendance.module.css";

export default function StudentAttendancePage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [attendanceData, setAttendanceData] = useState<any>({});
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.STUDENT.ATTENDANCE, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) setAttendanceData(data.data);
                setLoadingData(false);
            })
            .catch(err => {
                console.error("Failed to fetch attendance:", err);
                setLoadingData(false);
            });
    }, [token]);

    if (isLoading || !user) return null;

    const getCircleGradient = (pct: number) => {
        if (pct >= 85) return "linear-gradient(135deg, #10b981, #059669)";
        if (pct >= 70) return "linear-gradient(135deg, #f59e0b, #d97706)";
        return "linear-gradient(135deg, #ef4444, #b91c1c)";
    };

    return (
        <LMSShell pageTitle="My Attendance">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Attendance Records</div>
                        <div className={styles.bannerSub}>Track your presence across all your enrolled batches.</div>
                    </div>
                    <CalendarCheck size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Content */}
                {loadingData ? (
                    <div className={styles.batchGrid}>
                        {[1, 2].map(i => <div key={i} className={styles.skeleton} />)}
                    </div>
                ) : Object.keys(attendanceData).length === 0 ? (
                    <div className={styles.emptyState}>
                        <CalendarCheck size={52} color="#94a3b8" weight="duotone" />
                        <h3>No Attendance Records Yet</h3>
                        <p>Your teachers haven't marked any attendance for your enrolled batches.</p>
                    </div>
                ) : (
                    <div className={styles.batchGrid}>
                        {Object.entries(attendanceData).map(([batchName, data]: [string, any]) => {
                            const percentage = Math.round((data.present / data.total) * 100) || 0;
                            return (
                                <div key={batchName} className={styles.batchCard}>
                                    {/* Card Header */}
                                    <div className={styles.batchHeader}>
                                        <div>
                                            <div className={styles.batchTitle}>{batchName}</div>
                                            <div className={styles.batchSubtitle}>{data.total} Total Classes Recorded</div>
                                        </div>
                                        <div
                                            className={styles.percentageCircle}
                                            style={{ background: getCircleGradient(percentage) }}
                                        >
                                            {percentage}%
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    {percentage < 75 && (
                                        <div className={styles.warningBanner}>
                                            <WarningCircle size={18} weight="fill" />
                                            Attendance below 75% — Please attend more classes!
                                        </div>
                                    )}

                                    {/* Stats Row */}
                                    <div className={styles.statsRow}>
                                        <div className={`${styles.stat} ${styles.present}`}>
                                            <div className={styles.statValue}>{data.present}</div>
                                            <div className={styles.statLabel}>Present</div>
                                        </div>
                                        <div className={`${styles.stat} ${styles.absent}`}>
                                            <div className={styles.statValue}>{data.absent}</div>
                                            <div className={styles.statLabel}>Absent</div>
                                        </div>
                                        <div className={`${styles.stat} ${styles.late}`}>
                                            <div className={styles.statValue}>{data.late}</div>
                                            <div className={styles.statLabel}>Late</div>
                                        </div>
                                    </div>

                                    {/* History */}
                                    <div className={styles.historySection}>
                                        <h3>Recent History</h3>
                                        <div className={styles.historyList}>
                                            {data.records?.length > 0 ? (
                                                data.records.slice(0, 10).map((record: any) => (
                                                    <div key={record.id} className={styles.historyItem}>
                                                        <span className={styles.historyDate}>
                                                            {new Date(record.date).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric", year: "numeric",
                                                            })}
                                                        </span>
                                                        <span className={`${styles.historyStatus} ${styles[record.status?.toLowerCase()]}`}>
                                                            {record.status}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No class history available.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
