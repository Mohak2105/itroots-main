"use client";

import { use, useMemo } from "react";
import LMSShell from "@/components/lms/LMSShell";
import { resolveStudentContentUrl } from "@/utils/studentContentViewer";
import styles from "./viewer.module.css";
import { ArrowLeft, ArrowsOutSimple, PlayCircle } from "@phosphor-icons/react";

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
            if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
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
    return embedUrl.toString();
};

const isDirectVideoUrl = (rawUrl: string) => {
    const normalizedUrl = rawUrl.split("?")[0].toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((extension) => normalizedUrl.endsWith(extension));
};

const isPdfUrl = (rawUrl: string) => {
    const normalizedUrl = rawUrl.split(/[?#]/)[0].toLowerCase();
    return normalizedUrl.endsWith(".pdf");
};

const buildInlinePdfUrl = (rawUrl: string) =>
    `${rawUrl}${rawUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit`;

interface ContentViewerPageProps {
    searchParams: Promise<{
        title?: string | string[];
        url?: string | string[];
    }>;
}

export default function ContentViewerPage({ searchParams }: ContentViewerPageProps) {
    const resolvedSearchParams = use(searchParams);
    const titleValue = resolvedSearchParams?.title;
    const urlValue = resolvedSearchParams?.url;
    const title = Array.isArray(titleValue) ? titleValue[0] || "Content Viewer" : titleValue || "Content Viewer";
    const resolvedUrl = resolveStudentContentUrl(Array.isArray(urlValue) ? urlValue[0] || "" : urlValue || "");

    const embedUrl = useMemo(() => getYouTubeEmbedUrl(resolvedUrl), [resolvedUrl]);
    const showDirectVideo = useMemo(() => isDirectVideoUrl(resolvedUrl), [resolvedUrl]);
    const showPdfDocument = useMemo(() => isPdfUrl(resolvedUrl), [resolvedUrl]);
    const pdfViewerUrl = useMemo(
        () => (showPdfDocument ? buildInlinePdfUrl(resolvedUrl) : ""),
        [resolvedUrl, showPdfDocument],
    );

    return (
        <LMSShell pageTitle="Content Viewer">
            <div className={styles.page}>
                <div className={styles.header}>
                    <button type="button" className={styles.backBtn} onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    
                </div>

                <section className={styles.viewerCard}>
                    <div className={styles.viewerHeader}>
                        <h1 className={styles.title}>{title}</h1>
                    </div>

                    <div className={styles.viewerBody}>
                        {!resolvedUrl ? (
                            <div className={styles.emptyState}>
                                <PlayCircle size={42} weight="duotone" />
                                <p>No content URL provided.</p>
                            </div>
                        ) : embedUrl ? (
                            <iframe
                                title={title}
                                src={embedUrl}
                                className={styles.player}
                                referrerPolicy="strict-origin-when-cross-origin"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                allowFullScreen
                            />
                        ) : showPdfDocument ? (
                            <div className={styles.pdfViewerWrap}>
                                <iframe
                                    title={title}
                                    src={pdfViewerUrl}
                                    className={styles.pdfViewerFrame}
                                />
                            </div>
                        ) : showDirectVideo ? (
                            <video className={styles.player} controls preload="metadata" src={resolvedUrl} />
                        ) : (
                            <iframe title={title} src={resolvedUrl} className={styles.player} />
                        )}
                    </div>
                </section>
            </div>
        </LMSShell>
    );
}
