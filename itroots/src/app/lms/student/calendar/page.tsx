"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import { BookOpen, CalendarDots, Clock, Link as LinkIcon, VideoCamera } from "@phosphor-icons/react";
import { getLiveClassAccessState, getLiveClassProviderLabel, resolveLiveClassJoinTarget } from "@/utils/liveClasses";
import styles from "./calendar.module.css";

type LiveClassItem = {
    id: string;
    batchId: string;
    scheduledAt: string;
    status: string;
    title: string;
    meetingLink?: string;
    provider?: string;
    zoomMeetingNumber?: string | null;
    joinPath?: string | null;
    description?: string;
    course?: { title?: string };
    batch?: { name?: string };
};

export default function StudentCalendarPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        const fetchLiveClasses = async () => {
            try {
                setError("");
                const response = await fetch(ENDPOINTS.STUDENT.LIVE_CLASSES, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await response.json().catch(() => []);
                if (!response.ok) {
                    throw new Error((data as { message?: string } | null)?.message || "Unable to load live classes");
                }

                if (Array.isArray(data)) {
                    setLiveClasses(data);
                    return;
                }

                if (Array.isArray((data as { data?: LiveClassItem[] } | null)?.data)) {
                    setLiveClasses((data as { data: LiveClassItem[] }).data);
                    return;
                }

                setLiveClasses([]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load live classes");
                setLiveClasses([]);
            }
        };

        void fetchLiveClasses();

        const intervalId = window.setInterval(() => {
            void fetchLiveClasses();
        }, 15000);

        return () => window.clearInterval(intervalId);
    }, [token]);

    const visibleClasses = useMemo(
        () => liveClasses.filter((item) => item.status !== "COMPLETED"),
        [liveClasses],
    );

    const sortedClasses = useMemo(
        () => [...visibleClasses].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        [visibleClasses],
    );

    const availableClasses = useMemo(
        () => sortedClasses.filter((item) => getLiveClassAccessState(item) === "AVAILABLE"),
        [sortedClasses],
    );

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Live Classes">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Live Classes</div>
                        <div className={styles.bannerSub}>See your scheduled classes and use the join link directly from the LMS.</div>
                    </div>
                    <VideoCamera size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryValue}>{availableClasses.length}</div>
                        <div className={styles.summaryLabel}>Available To Join</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryValue}>{sortedClasses.length}</div>
                        <div className={styles.summaryLabel}>Total Live Classes</div>
                    </div>
                </div>

                {error ? <div className={styles.errorBanner}>{error}</div> : null}

                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Join Live Classes</h2>
                            <p>Open the scheduled meeting links for your upcoming live classes.</p>
                        </div>
                    </div>

                    {sortedClasses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <CalendarDots size={44} color="#cbd5e1" weight="duotone" />
                            <p>No live classes are scheduled right now.</p>
                        </div>
                    ) : (
                        <div className={styles.liveClassList}>
                            {sortedClasses.map((event) => {
                                const scheduledDate = new Date(event.scheduledAt);
                                const isCancelled = event.status === "CANCELLED";
                                const joinTarget = resolveLiveClassJoinTarget(event, "STUDENT");
                                const accessState = getLiveClassAccessState(event);
                                const joinDisabledLabel = accessState === "NOT_STARTED"
                                    ? "Starts at Scheduled Time"
                                    : accessState === "EXPIRED"
                                        ? "Session Expired"
                                        : accessState === "COMPLETED"
                                            ? "Class Ended"
                                            : isCancelled
                                                ? "Class Cancelled"
                                                : "Join Unavailable";

                                return (
                                    <article key={event.id} className={styles.liveClassCard}>
                                        <div className={styles.liveClassTop}>
                                            <div className={styles.liveClassIcon}>
                                                <VideoCamera size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.liveClassInfo}>
                                                <div className={styles.liveClassTitleRow}>
                                                    <h3 className={styles.liveClassTitle}>{event.title}</h3>
                                                    <span className={`${styles.statusPill} ${isCancelled ? styles.statusCancelled : styles.statusActive}`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                                <div className={styles.metaRow}>
                                                    <span className={styles.metaItem}><BookOpen size={14} />{event.course?.title || "Course"}</span>
                                                    <span className={styles.metaItem}><CalendarDots size={14} />{event.batch?.name || "Batch"}</span>
                                                    <span className={styles.metaItem}><Clock size={14} />{scheduledDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {scheduledDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
                                                </div>
                                                <p className={styles.liveClassDesc}>{getLiveClassProviderLabel(event.provider)}</p>
                                                {event.provider === "ZOOM"
                                                    ? <p className={styles.liveClassDesc}>Zoom session available inside the LMS.</p>
                                                    : event.provider === "JITSI"
                                                        ? <p className={styles.liveClassDesc}>Jitsi session available inside the LMS.</p>
                                                        : event.meetingLink
                                                            ? <p className={styles.liveClassDesc}>Meeting link available for this session.</p>
                                                            : null}
                                                {event.description ? <p className={styles.liveClassDesc}>{event.description}</p> : null}
                                            </div>
                                        </div>
                                        <div className={styles.liveClassActions}>
                                            {accessState !== "AVAILABLE" || !joinTarget.href ? (
                                                <span className={`${styles.joinButton} ${styles.joinButtonDisabled}`}>
                                                    <LinkIcon size={16} />
                                                    {joinDisabledLabel}
                                                </span>
                                            ) : joinTarget.external ? (
                                                <a
                                                    className={styles.joinButton}
                                                    href={joinTarget.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <LinkIcon size={16} />
                                                    Open Link
                                                </a>
                                            ) : (
                                                <Link className={styles.joinButton} href={joinTarget.href}>
                                                    <LinkIcon size={16} />
                                                    Join in LMS
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
