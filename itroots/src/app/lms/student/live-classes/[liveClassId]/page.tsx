"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, VideoCamera } from "@phosphor-icons/react";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import JitsiLiveRoom from "@/components/lms/JitsiLiveRoom";
import { ENDPOINTS } from "@/config/api";
import styles from "@/components/lms/live-class-page.module.css";

type LiveClassDetail = {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    provider?: string;
    roomName?: string | null;
    jitsiDomain?: string | null;
    meetingLink?: string | null;
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

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token || !params?.liveClassId) return;

        const fetchLiveClass = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await fetch(ENDPOINTS.STUDENT.LIVE_CLASS(params.liveClassId), {
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

        const intervalId = window.setInterval(() => {
            void fetchLiveClass();
        }, 10000);

        return () => window.clearInterval(intervalId);
    }, [token, params?.liveClassId]);

    if (isLoading || !user) return null;

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
                    <div className={styles.actionCard}>
                        <div className={styles.actionTitle}>Loading live class...</div>
                    </div>
                ) : error ? (
                    <div className={styles.actionCard}>
                        <div className={styles.actionTitle}>Unable to open live class</div>
                        <div className={styles.actionBody}>{error}</div>
                    </div>
                ) : liveClass ? (
                    <>
                        <div className={styles.infoCard}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Provider</span>
                                    <span className={styles.infoValue}>{liveClass.provider || "EXTERNAL"}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Schedule</span>
                                    <span className={styles.infoValue}>{formatDateTime(liveClass.scheduledAt)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <span className={styles.infoValue}>{liveClass.status}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Room</span>
                                    <span className={styles.infoValue}>{liveClass.roomName || "External meeting"}</span>
                                </div>
                            </div>
                        </div>

                        {liveClass.status === "CANCELLED" ? (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>This class has been cancelled</div>
                                <div className={styles.actionBody}>You can no longer join this session from LMS.</div>
                            </div>
                        ) : liveClass.status === "COMPLETED" ? (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>This live class has ended</div>
                                <div className={styles.actionBody}>The teacher ended the session, so the join room has been closed.</div>
                                <Link href="/student/calendar" className={styles.primaryAction}>
                                    Back to Live Classes
                                </Link>
                            </div>
                        ) : liveClass.provider === "JITSI" && liveClass.roomName ? (
                            <JitsiLiveRoom
                                roomName={liveClass.roomName}
                                displayName={user.name}
                                email={user.email}
                                role="STUDENT"
                                domain={liveClass.jitsiDomain || undefined}
                                title={liveClass.title}
                                subtitle={subtitle}
                                showMetaBar={false}
                            />
                        ) : liveClass.meetingLink ? (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>External meeting link</div>
                                <div className={styles.actionBody}>
                                    This class still uses the previous external-link flow. Open it below.
                                </div>
                                <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                                    Open Meeting Link
                                </a>
                            </div>
                        ) : (
                            <div className={styles.actionCard}>
                                <div className={styles.actionTitle}>Join link unavailable</div>
                                <div className={styles.actionBody}>No valid room or external meeting link was found for this class.</div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </LMSShell>
    );
}
