"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Chalkboard,
    UsersThree,
    PlayCircle,
    ArrowRight,
    CalendarDots,
    Clock,
    VideoCamera,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref } from "@/utils/studentContentViewer";
import { resolveLiveClassJoinTarget } from "@/utils/liveClasses";
import styles from "./teacher-dashboard.module.css";

const ALL_BATCHES_VALUE = "__ALL_BATCHES__";

type BatchOption = {
    id: string;
    name: string;
    schedule?: string;
    course?: {
        title?: string;
    };
};

type DashboardData = {
    summary: {
        totalBatches: number;
        totalStudents: number;
        totalTests: number;
        totalContents: number;
        pendingAssignmentReviews: number;
        upcomingLiveClasses: number;
    };
    batches: BatchOption[];
    liveClasses: LiveClassItem[];
};

type BatchVideo = {
    id: string;
    title: string;
    description?: string;
    contentUrl?: string;
    createdAt?: string;
    type?: string;
    batchName?: string;
};

type LiveClassItem = {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    meetingLink?: string;
    joinPath?: string | null;
    provider?: string;
    description?: string;
    batch?: {
        name?: string;
    };
    course?: {
        title?: string;
    };
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

const getYouTubeEmbedUrl = (rawUrl?: string) => {
    const videoId = getYouTubeVideoId(String(rawUrl || "").trim());
    if (!videoId) return null;

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    return embedUrl.toString();
};

const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
    });
};

const resolveLiveClassJoin = (liveClass: LiveClassItem) => {
    return resolveLiveClassJoinTarget(liveClass, "TEACHER");
};

export default function FacultyDashboard() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [batchVideos, setBatchVideos] = useState<BatchVideo[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
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
            router.push("/faculty/login");
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

    useEffect(() => {
        if (dashboard.batches.length === 0) {
            setSelectedBatchId("");
            return;
        }

        setSelectedBatchId((currentBatchId) => {
            if (
                currentBatchId === ALL_BATCHES_VALUE
                || (currentBatchId && dashboard.batches.some((batch) => batch.id === currentBatchId))
            ) {
                return currentBatchId;
            }

            return dashboard.batches.length > 1 ? ALL_BATCHES_VALUE : dashboard.batches[0].id;
        });
    }, [dashboard.batches]);

    useEffect(() => {
        if (!token || !selectedBatchId) {
            setBatchVideos([]);
            return;
        }

        setLoadingVideos(true);
        const targetBatches =
            selectedBatchId === ALL_BATCHES_VALUE
                ? dashboard.batches
                : dashboard.batches.filter((batch) => batch.id === selectedBatchId);

        Promise.all(
            targetBatches.map((batch) =>
                fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${batch.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        const contents = Array.isArray(data?.contents)
                            ? data.contents
                            : Array.isArray(data?.data?.contents)
                                ? data.data.contents
                                : [];

                        return contents
                            .filter((item: BatchVideo) => item.type === "VIDEO")
                            .map((item: BatchVideo) => ({
                                ...item,
                                batchName: batch.name,
                            }));
                    }),
            ),
        )
            .then((videoGroups) => {
                const allVideos = videoGroups
                    .flat()
                    .sort((left, right) => {
                        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
                        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
                        return rightTime - leftTime;
                    });

                setBatchVideos(allVideos);
            })
            .catch((error) => {
                console.error(error);
                setBatchVideos([]);
            })
            .finally(() => setLoadingVideos(false));
    }, [token, selectedBatchId, dashboard.batches]);

    if (isLoading || !user) return null;

    const selectedBatch = dashboard.batches.find((batch) => batch.id === selectedBatchId) || null;
    const isViewingAllBatches = selectedBatchId === ALL_BATCHES_VALUE;
    const previewVideos = batchVideos.slice(0, 3).map((video) => ({
        ...video,
        embedUrl: getYouTubeEmbedUrl(video.contentUrl),
    }));
    const remainingVideos = batchVideos.slice(3);
    const videoLibraryHref = selectedBatchId
        ? isViewingAllBatches
            ? "/content?type=VIDEO"
            : `/content?batchId=${selectedBatchId}&type=VIDEO`
        : "/content";
    const upcomingLiveClasses = [...(dashboard.liveClasses || [])]
        .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
        .slice(0, 3);

    return (
        <LMSShell pageTitle="Teacher Dashboard">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div className={styles.bannerContent}>
                        <div>
                            <div className={styles.bannerTitle}>Faculty Dashboard</div>
                            <div className={styles.bannerSub}>Manage your assigned batches, schedule live classes.</div>
                        </div>
                    </div>
                    <div className={styles.bannerIconWrap}>
                        <Chalkboard size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                    </div>
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
                    
                    
                </section>

                

                <section className={styles.videoSection}>
                    <div className={styles.videoSectionHeader}>
                        <div>
                            <h3>Uploaded Videos</h3>
                            <p>
                                {isViewingAllBatches
                                    ? "Showing uploaded videos from all assigned batches."
                                    : selectedBatch
                                    ? `Showing videos for ${selectedBatch.name}`
                                    : "Select a batch to view uploaded videos."}
                            </p>
                        </div>
                        <Link
                            href={videoLibraryHref}
                            className={styles.videoLibraryLink}
                        >
                            Open Video Library <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loadingVideos ? (
                        <div className={styles.videoEmptyState}>Loading uploaded videos...</div>
                    ) : batchVideos.length === 0 ? (
                        <div className={styles.videoEmptyState}>
                            {isViewingAllBatches
                                ? "No videos uploaded in any assigned batch yet."
                                : selectedBatch
                                ? "No videos uploaded for this batch yet."
                                : "No batch selected."}
                        </div>
                    ) : (
                        <>
                            <div className={styles.videoPreviewGrid}>
                                {previewVideos.map((video) => (
                                    <article key={video.id} className={styles.videoPreviewTile}>
                                        <div className={styles.videoPreviewFrameWrap}>
                                            {video.embedUrl ? (
                                                <iframe
                                                    title={video.title}
                                                    src={video.embedUrl}
                                                    className={styles.videoPreviewFrame}
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className={styles.videoPreviewFallback}>
                                                    <PlayCircle size={36} weight="duotone" />
                                                    <span>Video Preview</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.videoPreviewBody}>
                                            <div className={styles.videoPreviewTitle}>{video.title}</div>
                                            <div className={styles.videoPreviewMeta}>
                                                <span>{video.batchName || "Assigned Batch"}</span>
                                                <span>{formatDate(video.createdAt) || "Recently uploaded"}</span>
                                            </div>
                                            
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {remainingVideos.length > 0 ? (
                            <div className={styles.videoGrid}>
                                {remainingVideos.map((video) => (
                                <div key={video.id} className={styles.videoCard}>
                                    <div className={styles.videoCardIcon}>
                                        <PlayCircle size={22} weight="duotone" />
                                    </div>
                                    <div className={styles.videoCardBody}>
                                        <div className={styles.videoCardTitle}>{video.title}</div>
                                        {video.batchName ? (
                                            <div className={styles.videoBatchTag}>{video.batchName}</div>
                                        ) : null}
                                        <div className={styles.videoCardMeta}>
                                            {formatDate(video.createdAt) || "Recently uploaded"}
                                        </div>
                                        {video.description ? (
                                            <p className={styles.videoCardDescription}>{video.description}</p>
                                        ) : null}
                                    </div>
                                    {video.contentUrl ? (
                                        <Link
                                            href={buildStudentContentViewerHref(video.contentUrl, video.title)}
                                            className={styles.watchVideoBtn}
                                        >
                                            Watch Video
                                        </Link>
                                    ) : null}
                                </div>
                                ))}
                            </div>
                            ) : null}
                        </>
                    )}
                </section>
            </div>
        </LMSShell>
    );
}
