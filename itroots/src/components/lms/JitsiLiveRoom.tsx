"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./live-class-page.module.css";

type JitsiLiveRoomProps = {
    roomName: string;
    userName: string;
    userEmail?: string;
    title: string;
    subtitle: string;
    audience?: "TEACHER" | "STUDENT";
};

declare global {
    interface Window {
        JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
            dispose?: () => void;
        };
        __itrootsJitsiScriptPromise?: Promise<void>;
    }
}

const JITSI_SCRIPT_ID = "itroots-jitsi-external-api";

const normalizeJitsiDomain = (value: string) => (
    value
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/+$/, "")
);

const normalizeJitsiAppId = (value: string) => value.trim().replace(/^\/+|\/+$/g, "");
const isJaasDomain = (domain: string) => domain === "8x8.vc";

const resolveJitsiRoomPath = (domain: string, roomName: string, appId: string) => {
    if (!roomName) return "";
    if (isJaasDomain(domain) && appId) {
        return `${appId}/${roomName}`;
    }
    return roomName;
};

const buildJitsiMeetingLink = (domain: string, roomPath: string) => (
    domain && roomPath ? `https://${domain}/${roomPath}` : ""
);

const resetJitsiExternalApiLoader = () => {
    window.__itrootsJitsiScriptPromise = undefined;
    const existingScript = document.getElementById(JITSI_SCRIPT_ID);
    existingScript?.remove();
};

const loadJitsiExternalApi = async (domain: string) => {
    if (window.JitsiMeetExternalAPI) {
        return;
    }

    if (!window.__itrootsJitsiScriptPromise) {
        window.__itrootsJitsiScriptPromise = new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById(JITSI_SCRIPT_ID) as HTMLScriptElement | null;

            const handleLoad = () => resolve();
            const handleError = () => {
                resetJitsiExternalApiLoader();
                reject(new Error("Unable to load the Jitsi embed script"));
            };

            if (existingScript) {
                existingScript.addEventListener("load", handleLoad, { once: true });
                existingScript.addEventListener("error", handleError, { once: true });

                if (window.JitsiMeetExternalAPI) {
                    resolve();
                }
                return;
            }

            const script = document.createElement("script");
            script.id = JITSI_SCRIPT_ID;
            script.src = `https://${domain}/external_api.js`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = handleError;
            document.body.appendChild(script);
        });
    }

    try {
        await window.__itrootsJitsiScriptPromise;
    } catch (error) {
        resetJitsiExternalApiLoader();
        throw error;
    }
};

export default function JitsiLiveRoom({
    roomName,
    userName,
    userEmail,
    title,
    subtitle,
    audience = "STUDENT",
}: JitsiLiveRoomProps) {
    const jitsiRootRef = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [mediaNotice, setMediaNotice] = useState("");
    const [retryNonce, setRetryNonce] = useState(0);
    const joinWithoutInitialMedia = true;
    const jitsiDomain = useMemo(
        () => normalizeJitsiDomain(process.env.NEXT_PUBLIC_JITSI_DOMAIN || ""),
        [],
    );
    const jitsiAppId = useMemo(
        () => normalizeJitsiAppId(process.env.NEXT_PUBLIC_JITSI_APP_ID || ""),
        [],
    );
    const roomPath = useMemo(
        () => resolveJitsiRoomPath(jitsiDomain, roomName, jitsiAppId),
        [jitsiAppId, jitsiDomain, roomName],
    );
    const fallbackMeetingLink = useMemo(
        () => buildJitsiMeetingLink(jitsiDomain, roomPath),
        [jitsiDomain, roomPath],
    );
    const isAutomationMode = useMemo(() => {
        if (typeof window === "undefined") return false;
        return new URLSearchParams(window.location.search).get("e2e") === "1";
    }, []);
    const jitsiSessionConfig = useMemo(
        () => ({
            audience,
            isAutomationMode,
            jitsiAppId,
            jitsiDomain,
            roomPath,
            joinWithoutInitialMedia,
            userEmail,
            userName,
        }),
        [audience, isAutomationMode, jitsiAppId, jitsiDomain, roomPath, joinWithoutInitialMedia, userEmail, userName],
    );

    useEffect(() => {
        let mounted = true;
        let autoMediaEnabled = false;
        let mediaEnableAttempts = 0;
        let reconnectTimer: number | null = null;
        let jitsiApi: {
            dispose?: () => void;
            addEventListener?: (event: string, listener: (...args: unknown[]) => void) => void;
            executeCommand?: (command: string, ...args: unknown[]) => void;
            getIFrame?: () => HTMLIFrameElement;
            isAudioAvailable?: () => Promise<boolean>;
            isVideoAvailable?: () => Promise<boolean>;
            isAudioMuted?: () => Promise<boolean>;
            isVideoMuted?: () => Promise<boolean>;
        } | null = null;

        const initJitsi = async () => {
            try {
                setIsLoading(true);
                setError("");
                setMediaNotice("");

                if (!roomName) {
                    throw new Error("Jitsi room name is unavailable for this live class");
                }

                if (!jitsiSessionConfig.jitsiDomain) {
                    throw new Error("Jitsi domain is not configured. Set NEXT_PUBLIC_JITSI_DOMAIN.");
                }

                if (isJaasDomain(jitsiSessionConfig.jitsiDomain) && !jitsiSessionConfig.jitsiAppId) {
                    throw new Error("Jitsi app id is not configured. Set NEXT_PUBLIC_JITSI_APP_ID for your 8x8 JaaS app.");
                }

                if (!jitsiSessionConfig.roomPath) {
                    throw new Error("Jitsi room path could not be created for this live class");
                }

                await loadJitsiExternalApi(jitsiSessionConfig.jitsiDomain);
                if (!mounted || !jitsiRootRef.current || !window.JitsiMeetExternalAPI) {
                    return;
                }

                jitsiRootRef.current.innerHTML = "";

                jitsiApi = new window.JitsiMeetExternalAPI(jitsiSessionConfig.jitsiDomain, {
                    roomName: jitsiSessionConfig.roomPath,
                    parentNode: jitsiRootRef.current,
                    width: "100%",
                    height: "100%",
                    userInfo: {
                        displayName: jitsiSessionConfig.userName,
                        email: jitsiSessionConfig.userEmail || undefined,
                    },
                    configOverwrite: {
                        disableDeepLinking: true,
                        disableInitialGUM: jitsiSessionConfig.joinWithoutInitialMedia,
                        prejoinPageEnabled: false,
                        prejoinConfig: {
                            enabled: false,
                        },
                        startWithAudioMuted: true,
                        startWithVideoMuted: true,
                        startAudioOnly: false,
                    },
                    interfaceConfigOverwrite: {
                        MOBILE_APP_PROMO: false,
                    },
                });

                const jitsiIframe = jitsiApi.getIFrame?.();
                if (jitsiIframe) {
                    jitsiIframe.allow = "camera; microphone; fullscreen; display-capture; autoplay; clipboard-write";
                    jitsiIframe.setAttribute("allow", "camera; microphone; fullscreen; display-capture; autoplay; clipboard-write");
                    jitsiIframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
                }

                const refreshMediaNotice = async () => {
                    if (!mounted || !jitsiApi) return;

                    try {
                        const [
                            audioAvailable,
                            videoAvailable,
                        ] = await Promise.all([
                            jitsiApi.isAudioAvailable?.() ?? Promise.resolve(false),
                            jitsiApi.isVideoAvailable?.() ?? Promise.resolve(false),
                        ]);

                        if (!audioAvailable && !videoAvailable) return;
                        setMediaNotice("");
                    } catch {
                        setMediaNotice("");
                    }
                };

                const ensureMediaEnabled = async () => {
                    if (!mounted || !jitsiApi || autoMediaEnabled || mediaEnableAttempts >= 3) return;
                    autoMediaEnabled = true;
                    mediaEnableAttempts += 1;

                    try {
                        const [
                            audioAvailable,
                            videoAvailable,
                            audioMuted,
                            videoMuted,
                        ] = await Promise.all([
                            jitsiApi.isAudioAvailable?.() ?? Promise.resolve(false),
                            jitsiApi.isVideoAvailable?.() ?? Promise.resolve(false),
                            jitsiApi.isAudioMuted?.() ?? Promise.resolve(true),
                            jitsiApi.isVideoMuted?.() ?? Promise.resolve(true),
                        ]);

                        jitsiApi.executeCommand?.("displayName", jitsiSessionConfig.userName);

                        if (audioAvailable && audioMuted) {
                            jitsiApi.executeCommand?.("toggleAudio");
                        }

                        if (videoAvailable && videoMuted) {
                            jitsiApi.executeCommand?.("toggleVideo");
                        }

                        window.setTimeout(() => {
                            void refreshMediaNotice();
                        }, 700);

                        window.setTimeout(async () => {
                            if (!mounted || !jitsiApi) return;

                            try {
                                const [
                                    latestAudioAvailable,
                                    latestVideoAvailable,
                                    latestAudioMuted,
                                    latestVideoMuted,
                                ] = await Promise.all([
                                    jitsiApi.isAudioAvailable?.() ?? Promise.resolve(false),
                                    jitsiApi.isVideoAvailable?.() ?? Promise.resolve(false),
                                    jitsiApi.isAudioMuted?.() ?? Promise.resolve(true),
                                    jitsiApi.isVideoMuted?.() ?? Promise.resolve(true),
                                ]);

                                autoMediaEnabled = false;

                                if (
                                    (latestAudioAvailable && latestAudioMuted) ||
                                    (latestVideoAvailable && latestVideoMuted)
                                ) {
                                    void ensureMediaEnabled();
                                }
                            } catch {
                                autoMediaEnabled = false;
                            }
                        }, 1500);
                    } catch {
                        autoMediaEnabled = false;
                    }
                };

                jitsiApi.addEventListener?.("videoConferenceJoined", () => {
                    if (!mounted) return;
                    setHasJoined(true);
                    setIsLoading(false);
                    setMediaNotice("");
                });

                jitsiApi.addEventListener?.("videoConferenceLeft", () => {
                    if (!mounted) return;
                    setHasJoined(false);
                });

                jitsiApi.addEventListener?.("audioAvailabilityChanged", () => {
                    void refreshMediaNotice();
                });

                jitsiApi.addEventListener?.("videoAvailabilityChanged", () => {
                    void refreshMediaNotice();
                });

                jitsiApi.addEventListener?.("audioMuteStatusChanged", () => {
                    void refreshMediaNotice();
                });

                jitsiApi.addEventListener?.("videoMuteStatusChanged", () => {
                    void refreshMediaNotice();
                });

                jitsiApi.addEventListener?.("cameraError", () => {
                    if (!mounted) return;
                    setMediaNotice("Camera access is blocked or unavailable. Allow camera permission in your browser if you want to turn video on.");
                });

                jitsiApi.addEventListener?.("micError", () => {
                    if (!mounted) return;
                    setMediaNotice("Microphone access is blocked or unavailable. Allow mic permission in your browser if you want to speak.");
                });

                if (mounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Unable to load Jitsi meeting");
                    setIsLoading(false);
                    reconnectTimer = window.setTimeout(() => {
                        if (!mounted) return;
                        setError("");
                        setRetryNonce((current) => current + 1);
                    }, 2000);
                }
            }
        };

        void initJitsi();

        return () => {
            mounted = false;
            if (reconnectTimer) {
                window.clearTimeout(reconnectTimer);
            }
            jitsiApi?.dispose?.();
        };
    }, [jitsiSessionConfig, retryNonce, roomName]);

    if (error) {
        return (
            <div className={styles.actionCard} data-testid="jitsi-live-room-error">
                <div className={styles.actionTitle}>Jitsi embed unavailable</div>
                <div className={styles.actionBody}>{error}</div>
                <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => {
                        setError("");
                        setRetryNonce((current) => current + 1);
                    }}
                >
                    Retry Jitsi Join
                </button>
                {fallbackMeetingLink ? (
                    <a href={fallbackMeetingLink} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                        Open Jitsi Link
                    </a>
                ) : null}
            </div>
        );
    }

    return (
        <div
            className={styles.zoomRoomCard}
            data-testid="jitsi-live-room"
            data-joined={hasJoined ? "true" : "false"}
            data-automation-mode={isAutomationMode ? "true" : "false"}
        >
            <div className={styles.zoomRoomHeader}>
                <div className={styles.zoomRoomTitle}>{title}</div>
                <div className={styles.zoomRoomSub}>{subtitle}</div>
            </div>
            {mediaNotice ? (
                <div className={styles.mediaNotice} data-testid="jitsi-media-notice">{mediaNotice}</div>
            ) : null}
            {isLoading ? (
                <div className={styles.zoomLoading} data-testid="jitsi-loading">Loading Jitsi meeting...</div>
            ) : null}
            <div
                ref={jitsiRootRef}
                className={`${styles.jitsiEmbedRoot} ${hasJoined ? styles.jitsiEmbedRootJoined : styles.jitsiEmbedRootPrejoin}`}
                data-testid="jitsi-embed-root"
            />
        </div>
    );
}
