"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { ENDPOINTS } from "@/config/api";
import { resolveStudentContentUrl } from "@/utils/studentContentViewer";
import { fetchStudentUploadedVideos } from "@/utils/studentVideos";
import styles from "./student-learning.module.css";
import {
    Books,
    CaretLeft,
    CaretRight,
    MonitorPlay,
    PlayCircle,
} from "@/components/icons/lucide-phosphor";

type EnrollmentRecord = {
    id: string;
    batchId: string;
    progressPercent?: number;
    batch?: {
        id: string;
        name: string;
        schedule?: string;
        course?: {
            id: string;
            title: string;
        };
        Faculty?: {
            id: string;
            name: string;
        };
    };
};

type VideoRecord = {
    id: string;
    title: string;
    description?: string;
    contentUrl?: string;
    fileUrl?: string;
    createdAt?: string;
    uploadedAt?: string;
    subject?: string;
    batchId?: string;
};

type CourseVideo = {
    id: string;
    title: string;
    description?: string;
    createdAt?: string;
    batchId: string;
    batchName: string;
    courseTitle: string;
    resolvedUrl: string;
    embedUrl: string | null;
    isYouTube: boolean;
    isDirectVideo: boolean;
};

const VIDEOS_PER_PAGE = 6;

const getEmbedOrigin = () => {
    if (typeof window === "undefined") {
        return "";
    }
    return window.location.origin;
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

const getYouTubeEmbedUrl = (rawUrl: string) => {
    const videoId = getYouTubeVideoId(rawUrl);
    if (!videoId) return null;

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    const origin = getEmbedOrigin();
    if (origin) {
        embedUrl.searchParams.set("origin", origin);
    }
    return embedUrl.toString();
};

const isDirectVideoUrl = (rawUrl: string) => {
    const normalized = rawUrl.split("?")[0].toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((extension) => normalized.endsWith(extension));
};

const formatDateTime = (value?: string) => {
    if (!value) return "Recently uploaded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently uploaded";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

export default function StudentLearningPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();

    const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
    const [videosByBatch, setVideosByBatch] = useState<Record<string, VideoRecord[]>>({});
    const [selectedBatchId, setSelectedBatchId] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        let isCancelled = false;

        const loadLearning = async () => {
            setLoading(true);
            try {
                const learningResponse = await fetch(ENDPOINTS.STUDENT.MY_LEARNING, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const learningData = await learningResponse.json();

                if (!learningResponse.ok || !Array.isArray(learningData)) {
                    throw new Error(learningData?.message || "Failed to load your courses.");
                }

                if (isCancelled) return;
                setEnrollments(learningData);

                const normalizedVideos: VideoRecord[] = await fetchStudentUploadedVideos(token, learningData);
                const videoMap = learningData.reduce((acc: Record<string, VideoRecord[]>, enrollment: EnrollmentRecord) => {
                    acc[enrollment.batchId] = normalizedVideos.filter((video) => video.batchId === enrollment.batchId);
                    return acc;
                }, {});

                if (isCancelled) return;
                setVideosByBatch(videoMap);
                setFetchError(null);
            } catch (error: any) {
                if (!isCancelled) {
                    setFetchError(error?.message || "Could not load your course videos.");
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        loadLearning();

        return () => {
            isCancelled = true;
        };
    }, [token]);

    const batchOptions = useMemo(
        () => [
            { value: "ALL", label: "All Courses" },
            ...enrollments.map((enrollment) => ({
                value: enrollment.batchId,
                label: enrollment.batch?.name || "Assigned Batch",
            })),
        ],
        [enrollments]
    );

    const courseVideos = useMemo<CourseVideo[]>(() => {
        return enrollments
            .flatMap((enrollment) => {
                const batchVideos = videosByBatch[enrollment.batchId] || [];
                return batchVideos.map((video) => {
                    const resolvedUrl = resolveStudentContentUrl(video.contentUrl || video.fileUrl || "");
                    const embedUrl = getYouTubeEmbedUrl(resolvedUrl);
                    return {
                        id: video.id,
                        title: video.title || "Untitled Video",
                        description: video.description || "",
                        createdAt: video.createdAt || video.uploadedAt,
                        batchId: enrollment.batchId,
                        batchName: enrollment.batch?.name || "Assigned Batch",
                        courseTitle: video.subject || enrollment.batch?.course?.title || "Course",
                        resolvedUrl,
                        embedUrl,
                        isYouTube: Boolean(embedUrl),
                        isDirectVideo: isDirectVideoUrl(resolvedUrl),
                    };
                });
            })
            .sort((first, second) => {
                const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
                const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
                return secondTime - firstTime;
            });
    }, [enrollments, videosByBatch]);

    const filteredVideos = useMemo(
        () => (selectedBatchId === "ALL"
            ? courseVideos
            : courseVideos.filter((video) => video.batchId === selectedBatchId)),
        [courseVideos, selectedBatchId]
    );

    useEffect(() => {
        setCurrentPage(1);
        setShowAll(false);
    }, [selectedBatchId]);

    const totalPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));
    const visibleVideos = showAll
        ? filteredVideos
        : filteredVideos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="My Courses">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div className={styles.bannerContent}>
                        <div className={styles.bannerTitle}>My Courses</div>
                        <div className={styles.bannerSub}>
                            Watch uploaded class videos.
                        </div>
                    </div>
                </div>

                {fetchError ? (
                    <div className={styles.emptyState}>
                        <Books size={44} color="#94a3b8" weight="duotone" />
                        <h3>Could not load your videos</h3>
                        <p>{fetchError}</p>
                    </div>
                ) : loading ? (
                    <div className={styles.skeletonGrid}>
                        {Array.from({ length: VIDEOS_PER_PAGE }).map((_, index) => (
                            <div key={index} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Books size={44} color="#94a3b8" weight="duotone" />
                        <h3>No enrolled batches yet</h3>
                        <p>Your courses will appear here as soon as you are assigned to a batch.</p>
                        <Link href="/student/available-batches" className={styles.ctaBtn}>
                            Browse Available Batches
                        </Link>
                    </div>
                ) : (
                    <>
                        
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <div className={styles.sectionTitle}>Uploaded Videos</div>
                                    <div className={styles.sectionSub}>
                                        {showAll
                                            ? `Showing all ${filteredVideos.length} videos in this view`
                                            : `Showing ${visibleVideos.length} of ${filteredVideos.length} videos in this view`}
                                    </div>
                                </div>
                                <div className={styles.sectionActions}>
                                    {!showAll && currentPage > 1 ? (
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        >
                                            <CaretLeft size={16} />
                                            Previous
                                        </button>
                                    ) : null}

                                    {!showAll && currentPage < totalPages ? (
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        >
                                            View More
                                            <CaretRight size={16} />
                                        </button>
                                    ) : null}

                                    {filteredVideos.length > VIDEOS_PER_PAGE ? (
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            onClick={() => {
                                                setShowAll((value) => !value);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {showAll ? "Show 6 Per Page" : "View All"}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {filteredVideos.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <MonitorPlay size={44} color="#94a3b8" weight="duotone" />
                                    <h3>No uploaded videos yet</h3>
                                    <p>No uploaded videos available for this selection yet.</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.videoGrid}>
                                        {visibleVideos.map((video) => (
                                            <article key={video.id} className={styles.videoCard}>
                                                <div className={styles.videoFrameWrap}>
                                                    {video.isYouTube ? (
                                                        <iframe
                                                            title={video.title}
                                                            src={video.embedUrl || video.resolvedUrl}
                                                            className={styles.videoCardPlayer}
                                                            loading="lazy"
                                                            referrerPolicy="strict-origin-when-cross-origin"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                            allowFullScreen
                                                        />
                                                    ) : video.isDirectVideo ? (
                                                        <video
                                                            className={styles.videoCardPlayer}
                                                            controls
                                                            controlsList="nodownload"
                                                            preload="metadata"
                                                            src={video.resolvedUrl}
                                                        />
                                                    ) : (
                                                        <div className={styles.videoCardFallback}>
                                                            <PlayCircle size={34} weight="duotone" />
                                                            <span>Video Preview</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.videoCardBody}>
                                                    <div className={styles.videoCardTitle}>{video.title}</div>
                                                    <div className={styles.videoCardMeta}>
                                                        <span>{video.courseTitle}</span>
                                                        <span>{video.batchName}</span>
                                                        <span>{formatDateTime(video.createdAt)}</span>
                                                    </div>
                                                    
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    {!showAll && totalPages > 1 ? (
                                        <div className={styles.paginationInfo}>
                                            Page {currentPage} of {totalPages}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </section>
                    </>
                )}
            </div>
        </LMSShell>
    );
}
