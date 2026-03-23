"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Megaphone, Link as LinkIcon, CheckCircle } from "@/components/icons/lucide-phosphor";
import { ENDPOINTS } from "@/config/api";
import {
    buildStudentActionHref,
    extractStudentActionUrl,
    shouldOpenExternally,
} from "@/utils/studentContentViewer";
import styles from "./announcements.module.css";

type FeedKind = "ANNOUNCEMENT" | "NOTIFICATION";

type FeedItem = {
    id: string;
    notificationId?: string;
    title: string;
    body: string;
    createdAt: string;
    authorName: string;
    authorRole: string;
    batchName?: string;
    courseName?: string;
    kind: FeedKind;
    actionUrl?: string;
    actionLabel?: string;
    opensInNewTab?: boolean;
    readAt?: string | null;
};

const formatTimestamp = (value: string) => new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const removeMessageTimestamp = (message: string) => message
    .replace(/\s*\|\s*\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,\s*\d{1,2}:\d{2}\s*(?:AM|PM))?\s*$/i, "")
    .replace(/\s*\|\s*\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/i, "")
    .trim();

const mapAnnouncements = (items: any[]): FeedItem[] => items.map((item: any) => ({
    id: `announcement-${item.id}`,
    title: item.title || "Announcement",
    body: item.content || "",
    createdAt: item.createdAt,
    authorName: item.author?.name || "Admin",
    authorRole: item.author?.role || "ADMIN",
    batchName: item.batch?.name,
    kind: "ANNOUNCEMENT",
}));

const mapNotifications = (items: any[]): FeedItem[] => items.map((item: any) => {
    const notification = item.notification || {};
    const title = notification.title || "Notification";
    const rawActionUrl = extractStudentActionUrl(notification.message);
    const upperTitle = title.toUpperCase();
    const upperType = String(notification.type || "").toUpperCase();
    const actionLabel = upperType === "PLACEMENT"
        ? "View Placement"
        : upperTitle.includes("LIVE CLASS")
            ? "Join Class"
            : "View in LMS";
    const opensInNewTab = shouldOpenExternally(title, actionLabel, rawActionUrl);

    return {
        id: `notification-${item.id}`,
        notificationId: item.notificationId,
        title,
        body: notification.message || "",
        createdAt: notification.createdAt || item.createdAt,
        authorName: notification.creator?.name || "Admin",
        authorRole: notification.creator?.role || "ADMIN",
        batchName: notification.batch?.name,
        courseName: notification.course?.title,
        kind: "NOTIFICATION",
        actionUrl: rawActionUrl ? (opensInNewTab ? rawActionUrl : buildStudentActionHref(rawActionUrl, title)) : undefined,
        actionLabel: rawActionUrl ? actionLabel : undefined,
        opensInNewTab,
        readAt: item.readAt,
    };
});

const resolveGroupLabel = (item: FeedItem) => {
    if (item.batchName) return item.batchName;
    if (item.courseName) return item.courseName;
    return item.kind === "ANNOUNCEMENT" ? "All Students" : "General";
};

function ExpandableMessage({
    message,
    actionUrl,
    actionLabel,
    opensInNewTab,
}: {
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    opensInNewTab?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const cleanMessage = removeMessageTimestamp(message);
    const singleLine = cleanMessage.replace(/\n+/g, " ");
    const isLong = singleLine.length > 80;

    return (
        <div className={styles.tableSecondary}>
            <span className={!expanded && isLong ? styles.messageClamp : undefined}>
                {expanded || !isLong ? cleanMessage : singleLine}
            </span>
            {isLong ? (
                <button
                    type="button"
                    className={styles.inlineLink}
                    onClick={() => setExpanded((current) => !current)}
                >
                    {expanded ? "Read less" : "Read more"}
                </button>
            ) : null}
            {actionUrl ? (
                opensInNewTab ? (
                    <a href={actionUrl} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                        {actionLabel || "Open"}
                        <LinkIcon size={14} />
                    </a>
                ) : (
                    <Link href={actionUrl} className={styles.inlineLink}>
                        {actionLabel || "View in LMS"}
                        <LinkIcon size={14} />
                    </Link>
                )
            ) : null}
        </div>
    );
}

export default function StudentAnnouncementsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        Promise.all([
            fetch(ENDPOINTS.STUDENT.ANNOUNCEMENTS, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((response) => response.json()),
            fetch(ENDPOINTS.STUDENT.NOTIFICATIONS, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((response) => response.json()),
        ])
            .then(([announcementData, notificationData]) => {
                if (announcementData.success) {
                    setAnnouncements(announcementData.data || []);
                }
                setNotifications(Array.isArray(notificationData) ? notificationData : []);
            })
            .catch((error) => {
                console.error("Failed to fetch student feed:", error);
            })
            .finally(() => setLoadingData(false));
    }, [token]);

    const feedItems = useMemo(
        () => [...mapNotifications(notifications), ...mapAnnouncements(announcements)]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [announcements, notifications]
    );

    const markAsRead = async (notificationId?: string) => {
        if (!token || !notificationId) return;
        setMarkingId(notificationId);
        try {
            const response = await fetch(ENDPOINTS.STUDENT.MARK_NOTIFICATION_READ(notificationId), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Unable to mark notification as read");
            }

            setNotifications((current) => current.map((item: any) => (
                item.notificationId === notificationId ? { ...item, readAt: new Date().toISOString() } : item
            )));
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to mark notification as read");
        } finally {
            setMarkingId(null);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Notifications">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Notifications</div>
                        <div className={styles.bannerSub}>
                            Important updates from your Faculty and administration.
                        </div>
                    </div>
                    <Megaphone size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <section className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3>Notifications</h3>
                        {/* <span className={styles.cardMeta}>{feedItems.length}</span> */}
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyCell}>Loading notifications...</td>
                                    </tr>
                                ) : feedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyCell}>No notifications available right now.</td>
                                    </tr>
                                ) : (
                                    feedItems.map((item) => {
                                        const isRead = Boolean(item.readAt) || item.kind === "ANNOUNCEMENT";
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className={styles.tableStack}>
                                                        <div className={styles.tablePrimary}>{item.title}</div>
                                                        <ExpandableMessage
                                                            message={item.body}
                                                            actionUrl={item.actionUrl}
                                                            actionLabel={item.actionLabel}
                                                            opensInNewTab={item.opensInNewTab}
                                                        />
                                                    </div>
                                                </td>
                                               
                                                
                                                
                                                
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </LMSShell>
    );
}
