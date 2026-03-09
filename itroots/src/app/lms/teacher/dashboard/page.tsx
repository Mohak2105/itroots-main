"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChalkboardTeacher, ArrowRight, CalendarDots } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./Faculty-dashboard.module.css";

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

export default function FacultyDashboard() {
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
        if (!isLoading && (!user || user.role !== "Faculty")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.Faculty.DASHBOARD, {
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
                        <div className={styles.bannerSub}>Manage your assigned batches, content, and tests from one place.</div>
                    </div>
                    <ChalkboardTeacher size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}><ChalkboardTeacher size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalBatches}</span>
                            <span className={styles.statLabel}>Active Batches</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}><CalendarDots size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalContents}</span>
                            <span className={styles.statLabel}>Uploaded Materials</span>
                        </div>
                    </div>
                </section>

                <div className={styles.mainGrid}>
                    <section className={styles.section}>
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
                                            <Link href={`/lms/Faculty/batches/${batch.id}`} className={styles.manageBtn}>
                                                Manage Batch <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </LMSShell>
    );
}

