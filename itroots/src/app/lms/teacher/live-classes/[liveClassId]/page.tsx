"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power, VideoCamera } from "@/components/icons/lucide-phosphor";
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

export default function TeacherLiveClassRoomPage() {
    const params = useParams<{ liveClassId: string }>();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [liveClass, setLiveClass] = useState<LiveClassDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ending, setEnding] = useState(false);
    const [nowTick, setNowTick] = useState(() => Date.now());

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token || !params?.liveClassId) return;

        const fetchLiveClass = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await fetch(ENDPOINTS.Faculty.LIVE_CLASS(params.liveClassId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.message || "Unable to load live class");
                }
                setLiveClass(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load live class");
                setLiveClass(null);
            } finally {
                setLoading(false);
            }
        };

        void fetchLiveClass();
    }, [token, params?.liveClassId]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    if (isLoading || !user) return null;

    const handleEndLiveClass = async () => {
        if (!token || !liveClass?.id || ending) return;
        if (!window.confirm("End this live class now? Students will no longer be able to join.")) return;

        try {
            setEnding(true);
            const response = await fetch(ENDPOINTS.Faculty.COMPLETE_LIVE_CLASS(liveClass.id), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to end live class");
            }

            setLiveClass((current) => current ? { ...current, status: "COMPLETED" } : current);
            router.push("/faculty/calendar");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Unable to end live class");
        } finally {
            setEnding(false);
        }
    };

    const provider = getNormalizedLiveClassProvider(liveClass?.provider);
    const accessState = liveClass ? getLiveClassAccessState(liveClass, nowTick) : "UNAVAILABLE";
    const subtitle = liveClass
        ? `${liveClass.course?.title || "Course"} · ${liveClass.batch?.name || "Batch"} · ${formatDateTime(liveClass.scheduledAt)}`
        : "Loading live class details";

    return (
        <LMSShell pageTitle="Live Class Room">
            <div className={styles.page}>
                <Link href="/faculty/calendar" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Live Classes
                </Link>

                <div className={styles.hero}>
                    <div>
                        <div className={styles.heroTitle}>{liveClass?.title || "Live Class Room"}</div>
                        <div className={styles.heroSub}>{subtitle}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                        {liveClass?.status === "SCHEDULED" ? (
                            <button
                                type="button"
                                onClick={handleEndLiveClass}
                                disabled={ending}
                                style={{ border: "1px solid rgba(255,255,255,0.24)", background: "rgba(220,38,38,0.18)", color: "#fff", borderRadius: "14px", padding: "0.8rem 1rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.45rem", cursor: "pointer" }}
                            >
                                <Power size={16} /> {ending ? "Ending..." : "End Live Class"}
                            </button>
                        ) : null}
                        <VideoCamera size={56} color="rgba(255,255,255,0.24)" weight="duotone" />
                    </div>
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
                                <div className={styles.actionBody}>Students can no longer join this session.</div>
                            </div>
                        ) : accessState === "COMPLETED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="completed">
                                <div className={styles.actionTitle}>This live class has ended</div>
                                <div className={styles.actionBody}>The join link is no longer available to students.</div>
                            </div>
                        ) : accessState === "NOT_STARTED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="not-started">
                                <div className={styles.actionTitle}>Class has not started yet</div>
                                <div className={styles.actionBody}>Embedded access opens exactly at the scheduled start time.</div>
                            </div>
                        ) : accessState === "EXPIRED" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="expired">
                                <div className={styles.actionTitle}>Class session expired</div>
                                <div className={styles.actionBody}>This live class can only be opened for 120 minutes after the scheduled start time.</div>
                            </div>
                        ) : accessState === "UNAVAILABLE" ? (
                            <div className={styles.actionCard} data-testid="live-class-room-state" data-state="unavailable">
                                <div className={styles.actionTitle}>Live class unavailable</div>
                                <div className={styles.actionBody}>The schedule for this live class is invalid or incomplete.</div>
                            </div>
                        ) : provider === "JITSI" && liveClass.jitsiRoomName ? (
                            <JitsiLiveRoom
                                roomName={liveClass.jitsiRoomName}
                                userName={user.name}
                                userEmail={user.email}
                                title={liveClass.title}
                                subtitle={subtitle}
                                audience="TEACHER"
                            />
                        ) : provider === "ZOOM" && liveClass.zoomMeetingNumber ? (
                            <ZoomLiveRoom
                                liveClassId={liveClass.id}
                                token={token!}
                                audience="TEACHER"
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
