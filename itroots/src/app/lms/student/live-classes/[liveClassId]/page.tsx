"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, VideoCamera } from "@phosphor-icons/react";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import JitsiLiveRoom from "@/components/lms/JitsiLiveRoom";
import ZoomLiveRoom from "@/components/lms/ZoomLiveRoom";
import { ENDPOINTS } from "@/config/api";
import {
    getLiveClassAccessState,
    getNormalizedLiveClassProvider,
} from "@/utils/liveClasses";
import styles from "@/components/lms/live-class-page.module.css";

type LiveClassDetail = {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    provider?: string;
    meetingLink?: string | null;
    zoomMeetingNumber?: string | null;
    zoomPasscode?: string | null;
    jitsiRoomName?: string | null;
    description?: string;
    course?: { title?: string };
    batch?: { name?: string };
};

const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

export default function StudentLiveClassRoomPage() {
    const params = useParams<{ liveClassId: string }>();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [liveClass, setLiveClass] = useState<LiveClassDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [nowTick, setNowTick] = useState(() => Date.now());
    const liveClassRef = useRef<LiveClassDetail | null>(null);

    useEffect(() => {
        liveClassRef.current = liveClass;
    }, [liveClass]);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token || !params?.liveClassId) return;

        const fetchLiveClass = async (showLoader = false) => {
            try {
                if (showLoader) {
                    setLoading(true);
                    setError("");
                }
                const response = await fetch(ENDPOINTS.STUDENT.LIVE_CLASS(params.liveClassId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.message || "Unable to load live class");
                }
                setLiveClass(data);
            } catch (err) {
                if (showLoader || !liveClassRef.current) {
                    setError(err instanceof Error ? err.message : "Unable to load live class");
                    setLiveClass(null);
                } else {
                    console.error("Background live class refresh failed:", err);
                }
            } finally {
                if (showLoader) {
                    setLoading(false);
                }
            }
        };

        void fetchLiveClass(true);

        const intervalId = window.setInterval(() => {
            void fetchLiveClass(false);
        }, 10000);

        return () => window.clearInterval(intervalId);
    }, [token, params?.liveClassId]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    if (isLoading || !user) return null;

    const provider = getNormalizedLiveClassProvider(liveClass?.provider);
    const accessState = liveClass ? getLiveClassAccessState(liveClass, nowTick) : "UNAVAILABLE";
    const subtitle = liveClass
        ? `${liveClass.course?.title || "Course"} · ${liveClass.batch?.name || "Batch"} · ${formatDateTime(liveClass.scheduledAt)}`
        : "Loading live class details";

    return (
        <LMSShell pageTitle="Live Class Room">
            <div className={styles.page}>
                <Link href="/student/calendar" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Live Classes
                </Link>

                <div className={styles.hero}>
                    <div>
                        <div className={styles.heroTitle}>{liveClass?.title || "Live Class Room"}</div>
                        <div className={styles.heroSub}>{subtitle}</div>
                    </div>
                    <VideoCamera size={56} color="rgba(255,255,255,0.24)" weight="duotone" />
                </div>

                {loading ? (
                    <div className={styles.actionCard} data-testid="live-class-room-state" data-state="loading">
                        <div className={styles.actionTitle}>Loading live class...</div>
                    </div>
                ) : error ? (
                    <div className={styles.actionCard} data-testid="live-class-room-state" data-state="error">
                        <div className={styles.actionTitle}>Unable to open live class</div>
                        <div className={styles.actionBody}>{error}</div>
                    </div>
                ) : liveClass ? (
                    <>
                        {accessState === "CANCELLED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="cancelled">
                                <div className={styles.actionTitle}>This class has been cancelled</div>
                                <div className={styles.actionBody}>You can no longer join this session from LMS.</div>
                            </div>
                        ) : accessState === "COMPLETED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="completed">
                                <div className={styles.actionTitle}>This live class has ended</div>
                                <div className={styles.actionBody}>The teacher ended the session, so the meeting link is no longer active.</div>
                                <Link href="/student/calendar" className={styles.primaryAction}>
                                    Back to Live Classes
                                </Link>
                            </div>
                        ) : accessState === "NOT_STARTED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="not-started">
                                <div className={styles.actionTitle}>Class has not started yet</div>
                                <div className={styles.actionBody}>You can join this live class from LMS exactly at the scheduled start time.</div>
                                <Link href="/student/calendar" className={styles.primaryAction}>
                                    Back to Live Classes
                                </Link>
                            </div>
                        ) : accessState === "EXPIRED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="expired">
                                <div className={styles.actionTitle}>Class session expired</div>
                                <div className={styles.actionBody}>This session can only be opened for 120 minutes after the scheduled start time.</div>
                                <Link href="/student/calendar" className={styles.primaryAction}>
                                    Back to Live Classes
                                </Link>
                            </div>
                        ) : accessState === "UNAVAILABLE" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="unavailable">
                                <div className={styles.actionTitle}>Live class unavailable</div>
                                <div className={styles.actionBody}>The schedule for this live class is invalid or incomplete.</div>
                                <Link href="/student/calendar" className={styles.primaryAction}>
                                    Back to Live Classes
                                </Link>
                            </div>
                        ) : provider === "JITSI" && liveClass.jitsiRoomName ? (
                            <JitsiLiveRoom
                                roomName={liveClass.jitsiRoomName}
                                userName={user.name}
                                userEmail={user.email}
                                title={liveClass.title}
                                subtitle={subtitle}
                                audience="STUDENT"
                            />
                        ) : provider === "ZOOM" && liveClass.zoomMeetingNumber ? (
                            <ZoomLiveRoom
                                liveClassId={liveClass.id}
                                token={token!}
                                audience="STUDENT"
                                userName={user.name}
                                userEmail={user.email}
                                title={liveClass.title}
                                subtitle={subtitle}
                                fallbackMeetingLink={liveClass.meetingLink}
                            />
                        ) : liveClass.meetingLink ? (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>Meeting link</div>
                                <div className={styles.actionBody}>
                                    Open this live class in a new tab using the external meeting link.
                                </div>
                                <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                                    Open Meeting Link
                                </a>
                            </div>
                        ) : (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>Meeting link unavailable</div>
                                <div className={styles.actionBody}>No valid meeting link was found for this class.</div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </LMSShell>
    );
}
