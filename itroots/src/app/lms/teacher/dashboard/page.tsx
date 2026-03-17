"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Chalkboard,
    ArrowRight,
    CalendarDots,
    UsersThree,
    VideoCamera,
    PencilSimpleLine,
    Clock,
    BookOpen,
    Link as LinkIcon,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./teacher-dashboard.module.css";

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

const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
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
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
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

    const upcomingClasses = (dashboard.liveClasses || [])
        .filter((lc: any) => lc.status === "SCHEDULED" && new Date(lc.scheduledAt) >= new Date())
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5);

    return (
        <LMSShell pageTitle="Teacher Dashboard">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Teacher Dashboard</div>
                        <div className={styles.bannerSub}>Manage your assigned batches, schedule live classes, and track student progress.</div>
                    </div>
                    <Chalkboard size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}><Chalkboard size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalBatches}</span>
                            <span className={styles.statLabel}>Active Batches</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}><UsersThree size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.totalStudents}</span>
                            <span className={styles.statLabel}>Total Students</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}><VideoCamera size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.upcomingLiveClasses}</span>
                            <span className={styles.statLabel}>Upcoming Classes</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconOrange}`}><PencilSimpleLine size={24} /></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{dashboard.summary.pendingAssignmentReviews}</span>
                            <span className={styles.statLabel}>Pending Reviews</span>
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

                <div className={styles.twoColGrid}>
                    {/* Upcoming Live Classes */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3>Upcoming Live Classes</h3>
                            <Link href="/calendar" className={styles.viewAll}>View Calendar <ArrowRight size={14} /></Link>
                        </div>
                        <div className={styles.sectionBody}>
                            {upcomingClasses.length === 0 ? (
                                <div className={styles.emptyStateInline}>
                                    <VideoCamera size={36} color="#cbd5e1" weight="duotone" />
                                    <p>No upcoming live classes scheduled.</p>
                                </div>
                            ) : (
                                <div className={styles.liveClassList}>
                                    {upcomingClasses.map((lc: any) => (
                                        <div key={lc.id} className={styles.liveClassItem}>
                                            <div className={styles.liveClassAccent} />
                                            <div className={styles.liveClassContent}>
                                                <div className={styles.liveClassTitle}>{lc.title}</div>
                                                <div className={styles.liveClassMeta}>
                                                    <span><Clock size={13} /> {formatDateTime(lc.scheduledAt)}</span>
                                                    <span><BookOpen size={13} /> {lc.course?.title} / {lc.batch?.name}</span>
                                                </div>
                                                {lc.meetingLink && (
                                                    <a href={lc.meetingLink} target="_blank" rel="noreferrer" className={styles.joinLink}>
                                                        <LinkIcon size={13} /> Join Meeting
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* My Batches */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3>My Batches</h3>
                        </div>
                        <div className={styles.sectionBody}>
                            {dashboard.batches.length === 0 ? (
                                <div className={styles.emptyStateInline}>
                                    <Chalkboard size={36} color="#cbd5e1" weight="duotone" />
                                    <p>No batches assigned yet.</p>
                                </div>
                            ) : (
                                <div className={styles.batchList}>
                                    {dashboard.batches.map((batch) => (
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
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </LMSShell>
    );
}



