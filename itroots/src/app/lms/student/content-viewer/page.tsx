"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import LMSShell from "@/components/lms/LMSShell";
import { ArrowSquareOut, ArrowLeft, Browser, PlayCircle } from "@phosphor-icons/react";
import styles from "./viewer.module.css";

const getEmbedOrigin = () => {
    if (typeof window === "undefined") {
        return "";
    }
    return window.location.origin;
};

const getYouTubeEmbedUrl = (rawUrl: string) => {
    try {
        const url = new URL(rawUrl);
        const host = url.hostname.replace(/^www\./, "").toLowerCase();
        let videoId = "";

        if (host === "youtu.be") {
            videoId = url.pathname.split("/").filter(Boolean)[0] || "";
        } else if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v") || "";
            } else if (url.pathname.startsWith("/embed/")) {
                videoId = url.pathname.split("/")[2] || "";
            } else if (url.pathname.startsWith("/shorts/")) {
                videoId = url.pathname.split("/")[2] || "";
            }
        }

        if (!videoId) return null;

        const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
        embedUrl.searchParams.set("rel", "0");
        embedUrl.searchParams.set("modestbranding", "1");
        const origin = getEmbedOrigin();
        if (origin) {
            embedUrl.searchParams.set("origin", origin);
        }
        return embedUrl.toString();
    } catch {
        return null;
    }
};

export default function StudentContentViewerPage() {
    const searchParams = useSearchParams();
    const contentUrl = searchParams.get("url") || "";
    const title = searchParams.get("title") || "Content Viewer";

    const safeUrl = useMemo(() => {
        try {
            return decodeURIComponent(contentUrl);
        } catch {
            return contentUrl;
        }
    }, [contentUrl]);

    const youtubeEmbedUrl = useMemo(() => getYouTubeEmbedUrl(safeUrl), [safeUrl]);
    const frameUrl = youtubeEmbedUrl || safeUrl;
    const isYoutube = Boolean(youtubeEmbedUrl);

    return (
        <LMSShell pageTitle={title}>
            <div className={styles.page}>
                <div className={styles.headerRow}>
                    <Link href="/my-learning" className={styles.backBtn}>
                        <ArrowLeft size={16} /> Back to Learning
                    </Link>
                    {safeUrl ? (
                        <a href={safeUrl} target="_blank" rel="noreferrer" className={styles.openBtn}>
                            Open Original <ArrowSquareOut size={16} />
                        </a>
                    ) : null}
                </div>

                <div className={styles.viewerCard}>
                    <div className={styles.viewerHeader}>
                        <div>
                            <h2>{title}</h2>
                            <p>
                                {isYoutube
                                    ? "Playing YouTube content inside the LMS."
                                    : "Viewing Faculty-shared content inside the LMS."}
                            </p>
                        </div>
                        {isYoutube ? (
                            <PlayCircle size={42} color="#ef4444" weight="duotone" />
                        ) : (
                            <Browser size={42} color="#0881ec" weight="duotone" />
                        )}
                    </div>

                    {!frameUrl ? (
                        <div className={styles.emptyState}>No content URL was provided for this item.</div>
                    ) : (
                        <iframe
                            title={title}
                            src={frameUrl}
                            className={styles.viewerFrame}
                            referrerPolicy={isYoutube ? "strict-origin-when-cross-origin" : "no-referrer"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            allowFullScreen
                        />
                    )}
                </div>
            </div>
        </LMSShell>
    );
}