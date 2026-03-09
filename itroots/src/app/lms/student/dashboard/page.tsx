"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref, shouldOpenExternally } from "@/utils/studentContentViewer";
import styles from "./dashboard.module.css";
import {
    GraduationCap,
    CalendarCheck,
    Trophy,
    ArrowRight,
    BookOpen,
    Megaphone,
    Link as LinkIcon,
    Scroll,
    DownloadSimple,
} from "@phosphor-icons/react";

type DashboardData = {
    summary: {
        enrolledBatches: number;
        attendancePercentage: number;
        averageTestScore: number;
        pendingAssignments: number;
        upcomingLiveClasses: number;
        totalCertificates: number;
    };
    enrollments: any[];
    announcements: any[];
    notifications: any[];
    liveClasses: any[];
    certificates: any[];
};

type AttendanceBatch = {
    total: number;
    present: number;
    absent: number;
    late: number;
    records: Array<{
        id: string;
        date?: string;
        status?: string;
    }>;
};

type FeedItem = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    authorName: string;
    kind: "ANNOUNCEMENT" | "NOTIFICATION";
    actionUrl?: string;
    actionLabel?: string;
    opensInNewTab?: boolean;
};

const extractUrl = (value?: string) => value?.match(/https?:\/\/\S+|\/uploads\/\S+/)?.[0];

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

const buildNotificationAction = (title: string, rawActionUrl?: string) => {
    if (!rawActionUrl) {
        return { actionUrl: undefined, actionLabel: undefined, opensInNewTab: false };
    }

    const upperTitle = title.toUpperCase();
    const actionLabel = upperTitle.includes("LIVE CLASS")
        ? "Join"
        : upperTitle.includes("VIDEO")
            ? "Watch"
            : upperTitle.includes("ASSIGNMENT")
                ? "View"
                : "Open";
    const opensInNewTab = shouldOpenExternally(title, actionLabel);

    return {
        actionUrl: opensInNewTab ? rawActionUrl : buildStudentContentViewerHref(rawActionUrl, title),
        actionLabel,
        opensInNewTab,
    };
};

const toFeedItems = (announcements: any[], notifications: any[]): FeedItem[] => {
    const announcementItems = announcements.map((item: any) => ({
        id: `announcement-${item.id}`,
        title: item.title || "Announcement",
        body: item.content || "",
        createdAt: item.createdAt,
        authorName: item.author?.name || "Admin",
        kind: "ANNOUNCEMENT" as const,
    }));

    const notificationItems = notifications.map((item: any) => {
        const notification = item.notification || {};
        const title = notification.title || "Notification";
        const { actionUrl, actionLabel, opensInNewTab } = buildNotificationAction(
            title,
            extractUrl(notification.message)
        );

        return {
            id: `notification-${item.id}`,
            title,
            body: notification.message || "",
            createdAt: notification.createdAt || item.createdAt,
            authorName: notification.creator?.name || "Admin",
            kind: "NOTIFICATION" as const,
            actionUrl,
            actionLabel,
            opensInNewTab,
        };
    });

    return [...notificationItems, ...announcementItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
};

export default function StudentDashboard() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();

    const [dashboard, setDashboard] = useState<DashboardData>({
        summary: {
            enrolledBatches: 0,
            attendancePercentage: 0,
            averageTestScore: 0,
            pendingAssignments: 0,
            upcomingLiveClasses: 0,
            totalCertificates: 0,
        },
        enrollments: [],
        announcements: [],
        notifications: [],
        liveClasses: [],
        certificates: [],
    });
    const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceBatch>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.STUDENT.DASHBOARD, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data?.summary) {
                    setDashboard(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.STUDENT.ATTENDANCE, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data?.success && data?.data) {
                    setAttendanceData(data.data);
                }
            })
            .catch(console.error);
    }, [token]);

    const feedItems = useMemo(
        () => toFeedItems(dashboard.announcements || [], dashboard.notifications || []),
        [dashboard.announcements, dashboard.notifications]
    );

    const handleCertificateDownload = async (certificateId: string) => {
        if (!token) return;
        try {
            const response = await fetch(ENDPOINTS.STUDENT.CERTIFICATE_DOWNLOAD(certificateId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error("Unable to download certificate");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "certificate.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to download certificate");
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Dashboard">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Dashboard</div>
                        <div className={styles.bannerSub}>Track your batches, attendance, scores, and issued certificates.</div>
                    </div>
                    <GraduationCap size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <GraduationCap size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : dashboard.summary.enrolledBatches}</div>
                            <div className={styles.statLabel}>Enrolled Batches</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                            <CalendarCheck size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : `${dashboard.summary.attendancePercentage}%`}</div>
                            <div className={styles.statLabel}>Attendance</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                            <Trophy size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : `${dashboard.summary.averageTestScore}%`}</div>
                            <div className={styles.statLabel}>Average Test Score</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <Scroll size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : dashboard.summary.totalCertificates}</div>
                            <div className={styles.statLabel}>Certificates</div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTitle}>My Certificates</span>
                        <Link href="/certificates" className={styles.viewAll}>Open Certificates <ArrowRight size={14} /></Link>
                    </div>

                    {loading ? (
                        <div className={styles.skeletonList}>
                            {[1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
                        </div>
                    ) : dashboard.certificates.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Scroll size={40} color="#cbd5e1" weight="duotone" />
                            <p>No certificates issued yet.</p>
                        </div>
                    ) : (
                        <div className={styles.batchList}>
                            {dashboard.certificates.map((certificate: any) => (
                                <div key={certificate.id} className={styles.batchCard}>
                                    <div className={styles.batchAvatar}>{certificate.course?.title?.charAt(0) || "C"}</div>
                                    <div className={styles.batchInfo}>
                                        <div className={styles.batchName}>{certificate.course?.title || "Certificate"}</div>
                                        <div className={styles.batchCourse}>{certificate.certificateNumber}</div>
                                        <div className={styles.annMeta}>Issued on {new Date(certificate.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                                    </div>
                                    <button type="button" onClick={() => handleCertificateDownload(certificate.id)} className={styles.viewAll} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap" }}>
                                        PDF <DownloadSimple size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTitle}>Attendance Records</span>
                        <Link href="/attendance" className={styles.viewAll}>Open Attendance <ArrowRight size={14} /></Link>
                    </div>

                    {loading ? (
                        <div className={styles.skeletonList}>
                            {[1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
                        </div>
                    ) : Object.keys(attendanceData).length === 0 ? (
                        <div className={styles.emptyState}>
                            <CalendarCheck size={40} color="#cbd5e1" weight="duotone" />
                            <p>No attendance records yet.</p>
                        </div>
                    ) : (
                        <div className={styles.attendanceSections}>
                            {Object.entries(attendanceData).map(([batchName, data]) => {
                                const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;

                                return (
                                    <div key={batchName} className={styles.attendanceCard}>
                                        <div className={styles.attendanceHeader}>
                                            <div>
                                                <div className={styles.batchName}>{batchName}</div>
                                                <div className={styles.batchCourse}>{data.total} total classes recorded</div>
                                            </div>
                                            <div className={styles.attendanceBadges}>
                                                <span className={`${styles.attendanceBadge} ${styles.attendanceBlue}`}>Attendance {percentage}%</span>
                                                <span className={`${styles.attendanceBadge} ${styles.attendanceGreen}`}>Present {data.present}</span>
                                                <span className={`${styles.attendanceBadge} ${styles.attendanceRed}`}>Absent {data.absent}</span>
                                                <span className={`${styles.attendanceBadge} ${styles.attendanceAmber}`}>Late {data.late}</span>
                                            </div>
                                        </div>

                                        <div className={styles.attendanceTableWrap}>
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
                                                        data.records.slice(0, 5).map((record) => (
                                                            <tr key={record.id}>
                                                                <td>{formatDate(record.date)}</td>
                                                                <td>
                                                                    <span className={`${styles.statusPill} ${styles[record.status?.toLowerCase() || ""]}`}>
                                                                        {record.status || "-"}
                                                                    </span>
                                                                </td>
                                                                <td>{batchName}</td>
                                                                <td>{percentage}%</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className={styles.attendanceEmpty}>No attendance records available.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.twoCol}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>Continue Learning</span>
                            <Link href="/my-learning" className={styles.viewAll}>View All <ArrowRight size={14} /></Link>
                        </div>

                        {loading ? (
                            <div className={styles.skeletonList}>
                                {[1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
                            </div>
                        ) : dashboard.enrollments.length === 0 ? (
                            <div className={styles.emptyState}>
                                <BookOpen size={40} color="#cbd5e1" weight="duotone" />
                                <p>No batches enrolled yet.</p>
                            </div>
                        ) : (
                            <div className={styles.batchList}>
                                {dashboard.enrollments.slice(0, 4).map((item: any) => (
                                    <Link key={item.id} href={`/learning/${item.batch?.id}`} className={styles.batchCard}>
                                        <div className={styles.batchAvatar}>{item.batch?.course?.title?.charAt(0) || "B"}</div>
                                        <div className={styles.batchInfo}>
                                            <div className={styles.batchName}>{item.batch?.name || "Batch"}</div>
                                            <div className={styles.batchCourse}>{item.batch?.course?.title}</div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progressFill} style={{ width: `${item.progressPercent || 0}%` }} />
                                            </div>
                                        </div>
                                        <ArrowRight size={18} color="#0881ec" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>Notifications</span>
                            <Link href="/announcements" className={styles.viewAll}>Open Feed <ArrowRight size={14} /></Link>
                        </div>

                        {loading ? (
                            <div className={styles.skeletonList}>
                                {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
                            </div>
                        ) : feedItems.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Megaphone size={40} color="#cbd5e1" weight="duotone" />
                                <p>No notifications yet.</p>
                            </div>
                        ) : (
                            <div className={styles.annList}>
                                {feedItems.map((item) => (
                                    <div key={item.id} className={styles.annCard}>
                                        <div className={styles.annIcon} style={{ color: item.kind === "NOTIFICATION" ? "#0ea5e9" : "#0881ec" }}>
                                            <Megaphone size={16} weight="fill" />
                                        </div>
                                        <div className={styles.annContent}>
                                            <div className={styles.annTitle}>{item.title}</div>
                                            <div className={styles.annBody} style={{ whiteSpace: "pre-line" }}>{item.body}</div>
                                            <div className={styles.annMeta}>
                                                {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                {" | "}{item.authorName}
                                            </div>
                                            {item.actionUrl ? (
                                                item.opensInNewTab ? (
                                                    <a href={item.actionUrl} target="_blank" rel="noreferrer" className={styles.viewAll} style={{ display: "inline-flex", marginTop: "0.5rem" }}>
                                                        {item.actionLabel || "Open"} <LinkIcon size={14} />
                                                    </a>
                                                ) : (
                                                    <Link href={item.actionUrl} className={styles.viewAll} style={{ display: "inline-flex", marginTop: "0.5rem" }}>
                                                        {item.actionLabel || "View in LMS"} <LinkIcon size={14} />
                                                    </Link>
                                                )
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
