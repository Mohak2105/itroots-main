"use client";

import { useEffect, useRef, useState } from "react";
import { ENDPOINTS } from "@/config/api";
import styles from "./live-class-page.module.css";

type ZoomAudience = "TEACHER" | "STUDENT";

type ZoomLiveRoomProps = {
    liveClassId: string;
    token: string;
    audience: ZoomAudience;
    userName: string;
    userEmail?: string;
    title: string;
    subtitle: string;
    fallbackMeetingLink?: string | null;
};

type ZoomSignatureResponse = {
    signature: string;
    sdkKey?: string;
    meetingNumber: string;
    password?: string;
    meetingLink?: string;
    message?: string;
};

export default function ZoomLiveRoom({
    liveClassId,
    token,
    audience,
    userName,
    userEmail,
    title,
    subtitle,
    fallbackMeetingLink,
}: ZoomLiveRoomProps) {
    const zoomRootRef = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        let zoomClient: any = null;

        const initZoom = async () => {
            try {
                setIsLoading(true);
                setError("");

                const endpoint = audience === "TEACHER"
                    ? ENDPOINTS.Faculty.ZOOM_SIGNATURE(liveClassId)
                    : ENDPOINTS.STUDENT.ZOOM_SIGNATURE(liveClassId);

                const signatureResponse = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const signatureData = await signatureResponse.json().catch(() => null) as ZoomSignatureResponse | null;
                if (
                    !signatureResponse.ok
                    || !signatureData?.signature
                    || !signatureData.meetingNumber
                    || !signatureData.sdkKey
                ) {
                    throw new Error(
                        signatureData?.message
                        || "Unable to initialize Zoom meeting",
                    );
                }

                const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;
                if (!mounted || !zoomRootRef.current) {
                    return;
                }

                zoomClient = ZoomMtgEmbedded.createClient();

                await zoomClient.init({
                    zoomAppRoot: zoomRootRef.current,
                    language: "en-US",
                    patchJsMedia: true,
                });

                await zoomClient.join({
                    sdkKey: signatureData.sdkKey,
                    signature: signatureData.signature,
                    meetingNumber: signatureData.meetingNumber,
                    password: signatureData.password || "",
                    userName,
                    userEmail: userEmail || "",
                });

                zoomClient.on("connection-change", (payload: any) => {
                    if (!mounted) return;
                    if (payload?.state === "Closed") {
                        setIsLoading(false);
                    }
                });

                if (mounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Unable to load Zoom meeting");
                    setIsLoading(false);
                }
            }
        };

        void initZoom();

        return () => {
            mounted = false;
            if (zoomClient?.leaveMeeting) {
                void zoomClient.leaveMeeting().catch(() => undefined);
            }
        };
    }, [audience, liveClassId, token, userEmail, userName]);

    if (error) {
        return (
            <div className={styles.actionCard}>
                <div className={styles.actionTitle}>Zoom embed unavailable</div>
                <div className={styles.actionBody}>{error}</div>
                {fallbackMeetingLink ? (
                    <a href={fallbackMeetingLink} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                        Open Zoom Link
                    </a>
                ) : null}
            </div>
        );
    }

    return (
        <div className={styles.zoomRoomCard}>
            <div className={styles.zoomRoomHeader}>
                <div className={styles.zoomRoomTitle}>{title}</div>
                <div className={styles.zoomRoomSub}>{subtitle}</div>
            </div>
            {isLoading ? (
                <div className={styles.zoomLoading}>Loading Zoom meeting...</div>
            ) : null}
            <div ref={zoomRootRef} className={styles.zoomEmbedRoot} />
        </div>
    );
}
