"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import {
    buildStudentActionHref,
    buildStudentContentViewerHref,
    extractStudentActionUrl,
    shouldOpenExternally,
} from "@/utils/studentContentViewer";
import { fetchStudentUploadedVideos, type StudentVideoRecord } from "@/utils/studentVideos";
import styles from "./dashboard.module.css";
import {
    GraduationCap,
    CalendarCheck,
    ArrowRight,
    ChartBar,
    Megaphone,
    PlayCircle,
    VideoCamera,
} from "@/components/icons/lucide-phosphor";

type DashboardData = {
    summary: {
        enrolledBatches: number;
        attendancePercentage: number;
        averageTestScore: number;
        pendingAssignments: number;
        upcomingLiveClasses: number;
    };
    enrollments: any[];
    announcements: any[];
    notifications: any[];
    liveClasses: any[];
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
    notificationType?: string;
};

type UploadedVideoItem = StudentVideoRecord;

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

const getYouTubeVideoId = (rawUrl: string) => {
    try {
        const url = new URL(rawUrl);
        const host = url.hostname.replace(/^www\./, "").toLowerCase();

        if (host === "youtu.be") {
            return url.pathname.split("/").filter(Boolean)[0] || "";
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") {
                return url.searchParams.get("v") || "";
            }
            if (url.pathname.startsWith("/embed/")) {
                return url.pathname.split("/")[2] || "";
            }
            if (url.pathname.startsWith("/shorts/")) {
                return url.pathname.split("/")[2] || "";
            }
        }
    } catch {
        return "";
    }

    return "";
};

const getVideoThumbnail = (video: UploadedVideoItem) => {
    const videoUrl = video.contentUrl || video.fileUrl || "";
    const youtubeId = getYouTubeVideoId(videoUrl);
    if (youtubeId) {
        return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    return "";
};

const buildNotificationAction = (notificationType: string | undefined, title: string, rawActionUrl?: string) => {
    if (!rawActionUrl) {
        return { actionUrl: undefined, actionLabel: undefined, opensInNewTab: false };
    }

    const upperType = String(notificationType || "").toUpperCase();
    const upperTitle = title.toUpperCase();
    const actionLabel = upperType === "PLACEMENT"
        ? "View Placement"
        : upperTitle.includes("LIVE CLASS")
            ? "Join"
            : upperTitle.includes("VIDEO")
                ? "Watch"
                : upperTitle.includes("ASSIGNMENT")
                    ? "View"
                    : "Open";
    const opensInNewTab = shouldOpenExternally(title, actionLabel, rawActionUrl);

    return {
        actionUrl: opensInNewTab ? rawActionUrl : buildStudentActionHref(rawActionUrl, title),
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
            notification.type,
            title,
            extractStudentActionUrl(notification.message)
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
            notificationType: notification.type,
        };
    });

    return [...notificationItems, ...announcementItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
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
        },
        enrollments: [],
        announcements: [],
        notifications: [],
        liveClasses: [],
    });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [uploadedVideos, setUploadedVideos] = useState<UploadedVideoItem[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.STUDENT.DASHBOARD, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then(async (dashboardData) => {
                if (dashboardData?.summary) {
                    setDashboard(dashboardData);
                    setFetchError(null);
                } else {
                    const msg = dashboardData?.message || "Failed to load dashboard data.";
                    const detail = dashboardData?.detail ? ` (${dashboardData.detail})` : "";
                    setFetchError(msg + detail);
                }

                const enrollmentList = Array.isArray(dashboardData?.enrollments) ? dashboardData.enrollments : [];
                const videos = await fetchStudentUploadedVideos(token, enrollmentList);
                setUploadedVideos(videos);
            })
            .catch(() => setFetchError("Could not reach the server. Please check your connection."))
            .finally(() => setLoading(false));
    }, [token]);

    const feedItems = useMemo(
        () => toFeedItems(dashboard.announcements || [], dashboard.notifications || []),
        [dashboard.announcements, dashboard.notifications]
    );
    const batchNameById = useMemo(
        () =>
            Object.fromEntries(
                (dashboard.enrollments || []).map((enrollment: any) => [
                    enrollment.batchId,
                    enrollment.batch?.name || "Batch",
                ])
            ),
        [dashboard.enrollments]
    );
    const recentVideos = useMemo(() => uploadedVideos.slice(0, 3), [uploadedVideos]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Dashboard">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Dashboard</div>
                        <div className={styles.bannerSub}>Track your batches, attendance, scores, and notifications.</div>
                    </div>
                    <GraduationCap size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {fetchError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "0.85rem 1.2rem", fontSize: "0.9rem" }}>
                        <strong>Dashboard Error:</strong> {fetchError}
                    </div>
                )}

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
                            <ChartBar size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : `${dashboard.summary.averageTestScore}%`}</div>
                            <div className={styles.statLabel}>Avg. Score</div>
                        </div>
                    </div>
                </div>
                <div className={styles.singleCol}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <span className={styles.sectionTitle}>Uploaded Videos</span>
                                <div className={styles.sectionSub}>
                                    Showing {recentVideos.length} of {uploadedVideos.length} videos in this view
                                </div>
                            </div>
                            <Link href="/student/my-learning" className={styles.viewAll}>View More <ArrowRight size={14} /></Link>
                        </div>

                        {loading ? (
                            <div className={styles.videoCardGrid}>
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className={styles.videoSkeletonCard} />
                                ))}
                            </div>
                        ) : recentVideos.length === 0 ? (
                            <div className={styles.emptyState}>
                                <VideoCamera size={40} color="#cbd5e1" weight="duotone" />
                                <p>No uploaded videos yet.</p>
                            </div>
                        ) : (
                            <div className={styles.videoCardGrid}>
                                {recentVideos.map((video) => {
                                    const viewerUrl = buildStudentContentViewerHref(video.contentUrl || video.fileUrl || "", video.title);
                                    const thumbnail = getVideoThumbnail(video);
                                    return (
                                        <Link key={video.id} href={viewerUrl} className={styles.videoPreviewCard}>
                                            <div className={styles.videoPreviewThumb}>
                                                {thumbnail ? (
                                                    <img
                                                        src={thumbnail}
                                                        alt={video.title}
                                                        className={styles.videoPreviewImage}
                                                    />
                                                ) : (
                                                    <div className={styles.videoPreviewFallback}>
                                                        <VideoCamera size={28} weight="duotone" />
                                                    </div>
                                                )}
                                                <div className={styles.videoPreviewPlay}>
                                                    <PlayCircle size={56} weight="fill" />
                                                </div>
                                            </div>
                                            <div className={styles.videoPreviewBody}>
                                                <div className={styles.videoPreviewTitle}>{video.title || "Untitled Video"}</div>
                                                <div className={styles.videoPreviewMeta}>
                                                    {video.subject || "Course"}
                                                    {"  "}
                                                    {batchNameById[video.batchId || ""] || "Assigned Batch"}
                                                </div>
                                                <div className={styles.videoPreviewDate}>
                                                    {formatDate(video.uploadedAt || video.createdAt)}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <span className={styles.sectionTitle}>Recent Notifications</span>
                                <div className={styles.sectionSub}>Showing the latest 3 updates from your LMS feed.</div>
                            </div>
                            <Link href="/student/announcements" className={styles.viewAll}>View More <ArrowRight size={14} /></Link>
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
                                            {item.actionUrl ? (
                                                item.opensInNewTab ? (
                                                    <a href={item.actionUrl} target="_blank" rel="noreferrer" className={styles.annAction}>
                                                        {item.actionLabel || "Open"}
                                                        <ArrowRight size={14} />
                                                    </a>
                                                ) : (
                                                    <Link href={item.actionUrl} className={styles.annAction}>
                                                        {item.actionLabel || "Open"}
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                )
                                            ) : null}
                                            <div className={styles.annMeta}>{formatDate(item.createdAt)}</div>
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
