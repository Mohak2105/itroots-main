"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LMSShell from "@/components/lms/LMSShell";
import { useLMSAuth } from "@/app/lms/auth-context";
import { ENDPOINTS } from "@/config/api";
import styles from "@/app/lms/student/dashboard/dashboard.module.css";
import {
    ArrowLeft,
    CalendarCheck,
    GraduationCap,
    Megaphone,
    ShieldCheck,
    VideoCamera,
} from "@phosphor-icons/react";

type PreviewStudent = {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
};

type UploadedVideoItem = {
    id: string;
    title: string;
    description?: string;
    contentUrl?: string;
    fileUrl?: string;
    createdAt?: string;
    uploadedAt?: string;
    subject?: string;
};

type PreviewPayload = {
    student: PreviewStudent;
    summary: {
        enrolledBatches: number;
        attendancePercentage: number;
        averageTestScore: number;
        pendingAssignments: number;
        upcomingLiveClasses: number;
    };
    announcements: any[];
    notifications: any[];
    uploadedVideos: UploadedVideoItem[];
};

type FeedItem = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    kind: "ANNOUNCEMENT" | "NOTIFICATION";
};

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

const toFeedItems = (announcements: any[], notifications: any[]): FeedItem[] => {
    const announcementItems = announcements.map((item: any) => ({
        id: `announcement-${item.id}`,
        title: item.title || "Announcement",
        body: item.content || "",
        createdAt: item.createdAt,
        kind: "ANNOUNCEMENT" as const,
    }));

    const notificationItems = notifications.map((item: any) => {
        const notification = item.notification || {};
        return {
            id: `notification-${item.id}`,
            title: notification.title || "Notification",
            body: notification.message || "",
            createdAt: notification.createdAt || item.createdAt,
            kind: "NOTIFICATION" as const,
        };
    });

    return [...notificationItems, ...announcementItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
};

export default function AdminStudentDashboardPreviewPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const studentId = typeof params?.id === "string" ? params.id : "";
    const [payload, setPayload] = useState<PreviewPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token || !studentId) {
            return;
        }

        setLoading(true);
        fetch(ENDPOINTS.ADMIN.STUDENT_DASHBOARD_PREVIEW(studentId), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.message || "Failed to load student dashboard preview.");
                }
                setPayload(data);
                setFetchError(null);
            })
            .catch((error) => {
                setFetchError(error instanceof Error ? error.message : "Failed to load student dashboard preview.");
            })
            .finally(() => setLoading(false));
    }, [studentId, token]);

    const feedItems = useMemo(
        () => toFeedItems(payload?.announcements || [], payload?.notifications || []),
        [payload?.announcements, payload?.notifications]
    );

    if (isLoading || !user) {
        return null;
    }

    return (
        <LMSShell pageTitle="Student Dashboard Preview">
            <div className={styles.page}>
                <Link
                    href="/admin/students"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        color: "#0881ec",
                        fontWeight: 700,
                        textDecoration: "none",
                        width: "fit-content",
                    }}
                >
                    <ArrowLeft size={16} weight="bold" />
                    Back to Student Records
                </Link>

                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Student Dashboard Preview</div>
                        <div className={styles.bannerSub}>
                            {payload?.student ? `${payload.student.name} • ${payload.student.email}` : "Loading student dashboard..."}
                        </div>
                        <div
                            style={{
                                marginTop: "0.85rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.45rem 0.8rem",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.16)",
                                color: "#ffffff",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                            }}
                        >
                            <ShieldCheck size={14} weight="fill" />
                            Read-only admin view
                        </div>
                    </div>
                    <GraduationCap size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {fetchError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "10px", padding: "0.85rem 1.2rem", fontSize: "0.9rem" }}>
                        <strong>Preview Error:</strong> {fetchError}
                    </div>
                )}

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                            <GraduationCap size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : payload?.summary.enrolledBatches ?? 0}</div>
                            <div className={styles.statLabel}>Enrolled Batches</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                            <CalendarCheck size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : `${payload?.summary.attendancePercentage ?? 0}%`}</div>
                            <div className={styles.statLabel}>Attendance</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
                            <Megaphone size={22} weight="duotone" />
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{loading ? "-" : feedItems.length}</div>
                            <div className={styles.statLabel}>Notifications</div>
                        </div>
                    </div>
                </div>

                <div className={styles.singleCol}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <span className={styles.sectionTitle}>Uploaded Videos</span>
                                <div className={styles.sectionSub}>Read-only preview of the student dashboard video area.</div>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.videoCardGrid}>
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className={styles.videoSkeletonCard} />
                                ))}
                            </div>
                        ) : (payload?.uploadedVideos || []).length === 0 ? (
                            <div className={styles.emptyState}>
                                <VideoCamera size={40} color="#cbd5e1" weight="duotone" />
                                <p>No uploaded videos found for this student.</p>
                            </div>
                        ) : (
                            <div className={styles.videoCardGrid}>
                                {(payload?.uploadedVideos || []).map((video) => {
                                    const thumbnail = getVideoThumbnail(video);
                                    return (
                                        <div key={video.id} className={styles.videoPreviewCard} style={{ cursor: "default" }}>
                                            <div className={styles.videoPreviewThumb}>
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt={video.title} className={styles.videoPreviewImage} />
                                                ) : (
                                                    <div className={styles.videoPreviewFallback}>
                                                        <VideoCamera size={28} weight="duotone" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.videoPreviewBody}>
                                                <div className={styles.videoPreviewTitle}>{video.title || "Untitled Video"}</div>
                                                <div className={styles.videoPreviewMeta}>{video.subject || "Course"}</div>
                                                <div className={styles.videoPreviewDate}>{formatDate(video.uploadedAt || video.createdAt)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <span className={styles.sectionTitle}>Recent Notifications</span>
                                <div className={styles.sectionSub}>Latest updates shown on the student dashboard.</div>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.skeletonList}>
                                {[1, 2, 3].map((item) => <div key={item} className={styles.skeleton} />)}
                            </div>
                        ) : feedItems.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Megaphone size={40} color="#cbd5e1" weight="duotone" />
                                <p>No notifications found for this student.</p>
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
