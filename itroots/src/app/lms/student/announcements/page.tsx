"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Megaphone, Warning, PushPin, Link as LinkIcon } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./announcements.module.css";

type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type FeedKind = "ANNOUNCEMENT" | "NOTIFICATION";

type FeedItem = {
    id: string;
    title: string;
    body: string;
    priority: Priority;
    createdAt: string;
    authorName: string;
    authorRole: string;
    batchName?: string;
    kind: FeedKind;
    actionUrl?: string;
};

const extractUrl = (value?: string) => value?.match(/https?:\/\/\S+/)?.[0];

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

const mapNotifications = (items: any[]): FeedItem[] => items.map((item: any) => ({
    id: `notification-${item.id}`,
    title: item.notification?.title || "Notification",
    body: item.notification?.message || "",
    priority: item.notification?.title?.toUpperCase().includes("CANCELLED") ? "HIGH" : "NORMAL",
    createdAt: item.notification?.createdAt || item.createdAt,
    authorName: item.notification?.creator?.name || "Admin",
    authorRole: item.notification?.creator?.role || "ADMIN",
    batchName: item.notification?.batch?.name,
    kind: "NOTIFICATION",
    actionUrl: extractUrl(item.notification?.message),
}));

export default function StudentAnnouncementsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

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

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Notifications">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Notifications</div>
                        <div className={styles.bannerSub}>
                            Important updates from your teachers and administration.
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
                            <AnnouncementCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}

function AnnouncementCard({ item }: { item: FeedItem }) {
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

    return (
        <div className={styles.card} style={{ borderLeftColor: color }}>
            <div className={styles.iconWrapper} style={{ background: bg, color }}>
                {getIcon(item.priority)}
            </div>
            <div className={styles.content}>
                <div className={styles.meta}>
                    <span className={styles.badge} style={{ background: bg, color }}>{item.priority}</span>
                    {item.batchName ? (
                        <span className={styles.batchBadge}>Batch: {item.batchName}</span>
                    ) : (
                        <span className={styles.globalBadge}>Global Notice</span>
                    )}
                    <span className={styles.date}>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                        })}
                    </span>
                </div>
                <h3 className={styles.title}>{item.title}</h3>
                <div className={styles.body} style={{ whiteSpace: "pre-line" }}>{item.body}</div>
                {item.actionUrl ? (
                    <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem", color: "#0881ec", fontWeight: 700, textDecoration: "none" }}
                    >
                        {item.kind === "NOTIFICATION" && item.title.toUpperCase().includes("LIVE CLASS") ? "Join Class" : "Open Link"}
                        <LinkIcon size={16} />
                    </a>
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
                </div>
            </div>
        </div>
    );
}
