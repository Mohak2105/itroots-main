"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Megaphone, Warning, PushPin, Link as LinkIcon, CheckCircle } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref, shouldOpenExternally } from "@/utils/studentContentViewer";
import styles from "./announcements.module.css";

type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type FeedKind = "ANNOUNCEMENT" | "NOTIFICATION";

type FeedItem = {
    id: string;
    notificationId?: string;
    title: string;
    body: string;
    priority: Priority;
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

const extractUrl = (value?: string) => value?.match(/https?:\/\/\S+|\/uploads\/\S+/)?.[0];

const mapAnnouncements = (items: any[]): FeedItem[] => items.map((item: any) => ({
    id: `announcement-${item.id}`,
    title: item.title || "Announcement",
    body: item.content || "",
    priority: (item.priority || "NORMAL") as Priority,
    createdAt: item.createdAt,
    authorName: item.author?.name || "Admin",
    authorRole: item.author?.role || "ADMIN",
    batchName: item.batch?.name,
    kind: "ANNOUNCEMENT",
}));

const mapNotifications = (items: any[]): FeedItem[] => items.map((item: any) => {
    const title = item.notification?.title || "Notification";
    const rawActionUrl = extractUrl(item.notification?.message);
    const actionLabel = title.toUpperCase().includes("LIVE CLASS") ? "Join Class" : "View in LMS";
    const opensInNewTab = shouldOpenExternally(title, actionLabel);

    return {
        id: `notification-${item.id}`,
        notificationId: item.notificationId,
        title,
        body: item.notification?.message || "",
        priority: item.notification?.title?.toUpperCase().includes("CANCELLED") ? "HIGH" : "NORMAL",
        createdAt: item.notification?.createdAt || item.createdAt,
        authorName: item.notification?.creator?.name || "Admin",
        authorRole: item.notification?.creator?.role || "ADMIN",
        batchName: item.notification?.batch?.name,
        courseName: item.notification?.course?.title,
        kind: "NOTIFICATION",
        actionUrl: rawActionUrl ? (opensInNewTab ? rawActionUrl : buildStudentContentViewerHref(rawActionUrl, title)) : undefined,
        actionLabel: rawActionUrl ? actionLabel : undefined,
        opensInNewTab,
        readAt: item.readAt,
    };
});

export default function StudentAnnouncementsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        Promise.all([
            fetch(ENDPOINTS.STUDENT.ANNOUNCEMENTS, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
            fetch(ENDPOINTS.STUDENT.NOTIFICATIONS, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
        ])
            .then(([announcementData, notificationData]) => {
                if (announcementData.success) {
                    setAnnouncements(announcementData.data || []);
                }
                setNotifications(Array.isArray(notificationData) ? notificationData : []);
            })
            .catch((err) => {
                console.error("Failed to fetch student feed:", err);
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

                {loadingData ? (
                    <div className={styles.list}>
                        {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Megaphone size={52} color="#94a3b8" weight="duotone" />
                        <h3>No Notifications</h3>
                        <p>You have no notifications at this time.</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {feedItems.map((item) => (
                            <AnnouncementCard
                                key={item.id}
                                item={item}
                                markingId={markingId}
                                onMarkRead={markAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}

function AnnouncementCard({
    item,
    markingId,
    onMarkRead,
}: {
    item: FeedItem;
    markingId: string | null;
    onMarkRead: (notificationId?: string) => void;
}) {
    const priorityColor = (priority: Priority) => {
        if (priority === "URGENT") return "#ef4444";
        if (priority === "HIGH") return "#f59e0b";
        if (priority === "NORMAL") return "#0881ec";
        return "#6b7280";
    };

    const priorityBg = (priority: Priority) => {
        if (priority === "URGENT") return "#fee2e2";
        if (priority === "HIGH") return "#fef3c7";
        if (priority === "NORMAL") return "#eff6ff";
        return "#f3f4f6";
    };

    const getIcon = (priority: Priority) => {
        if (priority === "URGENT") return <Warning size={22} weight="fill" />;
        if (priority === "HIGH") return <PushPin size={22} weight="fill" />;
        return <Megaphone size={22} weight="fill" />;
    };

    const color = priorityColor(item.priority);
    const bg = priorityBg(item.priority);
    const targetName = item.batchName || item.courseName;
    const isRead = Boolean(item.readAt);

    return (
        <div className={styles.card} style={{ borderLeftColor: color }}>
            <div className={styles.iconWrapper} style={{ background: bg, color }}>
                {getIcon(item.priority)}
            </div>
            <div className={styles.content}>
                <div className={styles.meta}>
                    {item.priority !== "NORMAL" ? (
                        <span className={styles.badge} style={{ background: bg, color }}>{item.priority}</span>
                    ) : null}
                    {targetName ? (
                        <span className={styles.batchBadge}>{item.batchName ? `Batch: ${item.batchName}` : `Course: ${item.courseName}`}</span>
                    ) : null}
                    <span className={styles.date}>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                        })}
                    </span>
                </div>
                <h3 className={styles.title}>{item.title}</h3>
                <div className={styles.body} style={{ whiteSpace: "pre-line" }}>{item.body}</div>
                {item.actionUrl ? (
                    item.opensInNewTab ? (
                        <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem", color: "#0881ec", fontWeight: 700, textDecoration: "none" }}
                        >
                            {item.actionLabel || "Open"}
                            <LinkIcon size={16} />
                        </a>
                    ) : (
                        <Link
                            href={item.actionUrl}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem", color: "#0881ec", fontWeight: 700, textDecoration: "none" }}
                        >
                            {item.actionLabel || "View in LMS"}
                            <LinkIcon size={16} />
                        </Link>
                    )
                ) : null}
                <div className={styles.footer}>
                    <div className={styles.avatar}>
                        {item.authorName ? item.authorName.charAt(0).toUpperCase() : "A"}
                    </div>
                    <span>
                        Posted by <strong>{item.authorName}</strong>
                    </span>
                    <span className={styles.role}>
                        {" | "}{item.authorRole.replaceAll("_", " ").toLowerCase()}
                    </span>
                    {item.kind === "NOTIFICATION" ? (
                        isRead ? (
                            <span style={{ marginLeft: "auto", color: "#166534", fontWeight: 700, fontSize: "0.78rem" }}>Read</span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onMarkRead(item.notificationId)}
                                disabled={markingId === item.notificationId}
                                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "#0f172a", color: "#fff", borderRadius: "999px", padding: "0.45rem 0.75rem", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
                            >
                                <CheckCircle size={15} weight="bold" />
                                {markingId === item.notificationId ? "Updating..." : "Mark Read"}
                            </button>
                        )
                    ) : null}
                </div>
            </div>
        </div>
    );
}
