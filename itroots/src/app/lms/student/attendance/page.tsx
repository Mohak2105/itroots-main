"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { CalendarCheck, WarningCircle } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./attendance.module.css";

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
            .then((response) => response.json())
            .then((data) => {
                if (data.success) setAttendanceData(data.data);
                setLoadingData(false);
            })
            .catch((error) => {
                console.error("Failed to fetch attendance:", error);
                setLoadingData(false);
            });
    }, [token]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="My Attendance">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Attendance Records</div>
                        <div className={styles.bannerSub}>Track your presence across all your enrolled batches.</div>
                    </div>
                    <CalendarCheck size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {loadingData ? (
                    <div className={styles.tableSections}>
                        {[1, 2].map((item) => <div key={item} className={styles.skeleton} />)}
                    </div>
                ) : Object.keys(attendanceData).length === 0 ? (
                    <div className={styles.emptyState}>
                        <CalendarCheck size={52} color="#94a3b8" weight="duotone" />
                        <h3>No Attendance Records Yet</h3>
                        <p>Your Faculty haven't marked any attendance for your enrolled batches.</p>
                    </div>
                ) : (
                    <div className={styles.tableSections}>
                        {Object.entries(attendanceData).map(([batchName, data]: [string, any]) => {
                            const percentage = Math.round((data.present / data.total) * 100) || 0;
                            return (
                                <section key={batchName} className={styles.tableCard}>
                                    <div className={styles.tableHeader}>
                                        <div>
                                            <h3 className={styles.batchTitle}>{batchName}</h3>
                                            <p className={styles.batchSubtitle}>{data.total} total classes recorded</p>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span className={`${styles.summaryBadge} ${styles.summaryBlue}`}>Attendance {percentage}%</span>
                                            <span className={`${styles.summaryBadge} ${styles.summaryGreen}`}>Present {data.present}</span>
                                            <span className={`${styles.summaryBadge} ${styles.summaryRed}`}>Absent {data.absent}</span>
                                            <span className={`${styles.summaryBadge} ${styles.summaryAmber}`}>Late {data.late}</span>
                                        </div>
                                    </div>

                                    {percentage < 75 ? (
                                        <div className={styles.warningBanner}>
                                            <WarningCircle size={18} weight="fill" />
                                            Attendance below 75%. Please attend more classes.
                                        </div>
                                    ) : null}

                                    <div className={styles.tableWrapper}>
                                        <table className={styles.attendanceTable}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Batch</th>
                                                    <th>Attendance %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.records?.length > 0 ? (
                                                    data.records.map((record: any) => (
                                                        <tr key={record.id}>
                                                            <td>{formatDate(record.date)}</td>
                                                            <td>
                                                                <span className={`${styles.statusPill} ${styles[record.status?.toLowerCase()]}`}>
                                                                    {record.status}
                                                                </span>
                                                            </td>
                                                            <td>{batchName}</td>
                                                            <td>{percentage}%</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className={styles.emptyTableCell}>No class history available.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
