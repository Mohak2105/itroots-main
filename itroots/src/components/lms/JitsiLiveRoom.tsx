"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import styles from "./jitsi-live-room.module.css";

type JitsiRole = "TEACHER" | "STUDENT";

type JitsiLiveRoomProps = {
    roomName: string;
    displayName: string;
    email?: string;
    role: JitsiRole;
    domain?: string;
    title?: string;
    subtitle?: string;
    showMetaBar?: boolean;
};

const STUDENT_TOOLBAR_BUTTONS = [
    "microphone",
    "camera",
    "chat",
    "tileview",
    "hangup",
    "fullscreen",
];

const TEACHER_TOOLBAR_BUTTONS = [
    "microphone",
    "camera",
    "desktop",
    "chat",
    "participants-pane",
    "tileview",
    "hangup",
    "fullscreen",
];

const IFRAME_ALLOW_PERMISSIONS = [
    "autoplay",
    "camera",
    "microphone",
    "display-capture",
    "fullscreen",
    "clipboard-write",
].join("; ");

const applyIframePermissions = (iframe: HTMLIFrameElement | null) => {
    if (!(iframe instanceof HTMLIFrameElement)) {
        return;
    }

    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.display = "block";
    iframe.style.border = "0";
    iframe.setAttribute("allow", IFRAME_ALLOW_PERMISSIONS);
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
};

export default function JitsiLiveRoom({
    roomName,
    displayName,
    email,
    role,
    domain,
    title,
    subtitle,
    showMetaBar = true,
}: JitsiLiveRoomProps) {
    const resolvedDomain = String(domain || process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si").trim();
    const isTeacher = role === "TEACHER";

    return (
        <div className={styles.shell}>
            {showMetaBar ? (
                <div className={styles.metaBar}>
                    <div>
                        <div className={styles.metaTitle}>{title || "Live Class Room"}</div>
                        <div className={styles.metaSub}>{subtitle || roomName}</div>
                    </div>
                    <div className={styles.rolePill}>{isTeacher ? "Host" : "Student"}</div>
                </div>
            ) : null}

            <div className={styles.frameWrap}>
                <JitsiMeeting
                    domain={resolvedDomain}
                    roomName={roomName}
                    userInfo={{
                        displayName,
                        email: email || "",
                    }}
                    configOverwrite={{
                        prejoinPageEnabled: false,
                        prejoinConfig: {
                            enabled: false,
                        },
                        disableInitialGUM: false,
                        startWithAudioMuted: !isTeacher,
                        startWithVideoMuted: !isTeacher,
                        disableModeratorIndicator: !isTeacher,
                        toolbarButtons: isTeacher ? TEACHER_TOOLBAR_BUTTONS : STUDENT_TOOLBAR_BUTTONS,
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    }}
                    onApiReady={(externalApi) => {
                        const iframe = typeof externalApi?.getIFrame === "function"
                            ? externalApi.getIFrame()
                            : null;
                        applyIframePermissions(iframe instanceof HTMLIFrameElement ? iframe : null);
                    }}
                    getIFrameRef={(parentNode: HTMLDivElement) => {
                        parentNode.style.height = "100%";
                        parentNode.style.width = "100%";
                        parentNode.style.display = "block";

                        const applyCurrentFrame = () => {
                            const iframe = parentNode.querySelector("iframe");
                            applyIframePermissions(iframe instanceof HTMLIFrameElement ? iframe : null);
                        };

                        applyCurrentFrame();

                        if (!parentNode.querySelector("iframe")) {
                            const observer = new MutationObserver(() => {
                                applyCurrentFrame();
                                if (parentNode.querySelector("iframe")) {
                                    observer.disconnect();
                                }
                            });
                            observer.observe(parentNode, { childList: true, subtree: true });
                        }
                    }}
                />
            </div>
        </div>
    );
}
