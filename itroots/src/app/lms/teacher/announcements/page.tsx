"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./teacher-announcements.module.css";
import { Bell, CheckCircle, MegaphoneSimple } from "@phosphor-icons/react";

type NotificationRecipient = {
    id: string;
    notificationId: string;
    readAt?: string | null;
    createdAt: string;
    notification?: {
        id: string;
        title: string;
        message: string;
        type: string;
        createdAt: string;
        batch?: { id: string; name: string } | null;
        course?: { id: string; title: string } | null;
        creator?: { id: string; name: string; role: string } | null;
    };
};

const formatTimestamp = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
const removeMessageTimestamp = (message: string) => message
    .replace(/\s*\|\s*\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,\s*\d{1,2}:\d{2}\s*(?:AM|PM))?\s*$/i, "")
    .replace(/\s*\|\s*\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/i, "")
    .trim();

export default function FacultyAnnouncementsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationRecipient[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        fetch(ENDPOINTS.Faculty.NOTIFICATIONS, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                setNotifications(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                console.error("Failed to fetch Faculty notifications:", error);
            })
            .finally(() => setLoadingData(false));
    }, [token]);

    const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);

    const markAsRead = async (notificationId: string) => {
        if (!token) return;
        setMarkingId(notificationId);
        try {
            const response = await fetch(ENDPOINTS.Faculty.MARK_NOTIFICATION_READ(notificationId), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Unable to mark notification as read");
            }

            setNotifications((current) => current.map((item) => (
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
                        <div className={styles.bannerSub}>Admin and system updates relevant to your teaching assignments.</div>
                    </div>
                    <Bell size={58} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{notifications.length}</span>
                        <span className={styles.summaryLabel}>Total Notifications</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{unreadCount}</span>
                        <span className={styles.summaryLabel}>Unread</span>
                    </div>
                </div>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Notification Feed</h3>
                    </div>

                    {loadingData ? (
                        <div className={styles.emptyState}>Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className={styles.emptyState}>No notifications available right now.</div>
                    ) : (
                        <div className={styles.list}>
                            {notifications.map((item) => {
                                const notification = item.notification;
                                const targetName = notification?.batch?.name || notification?.course?.title || "General";
                                const isRead = Boolean(item.readAt);
                                const cleanMessage = removeMessageTimestamp(notification?.message || "");

                                return (
                                    <div key={item.id} className={styles.item}>
                                        <div className={styles.iconWrap}>
                                            <MegaphoneSimple size={20} weight="fill" />
                                        </div>
                                        <div className={styles.content}>
                                            <div className={styles.topRow}>
                                                <div>
                                                    <div className={styles.title}>{notification?.title || "Notification"}</div>
                                                    <div className={styles.meta}>
                                                        {notification?.type || "NOTIFICATION"} | {targetName}
                                                    </div>
                                                    <div className={styles.meta}>
                                                        Timestamp: {formatTimestamp(notification?.createdAt || item.createdAt)}
                                                    </div>
                                                </div>
                                                {isRead ? (
                                                    <span className={styles.readBadge}>Read</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={styles.readBtn}
                                                        onClick={() => markAsRead(item.notificationId)}
                                                        disabled={markingId === item.notificationId}
                                                    >
                                                        <CheckCircle size={16} weight="bold" />
                                                        {markingId === item.notificationId ? "Updating..." : "Mark Read"}
                                                    </button>
                                                )}
                                            </div>
                                            <div className={styles.message}>{cleanMessage}</div>
                                            <div className={styles.footer}>
                                                From {notification?.creator?.name || "Admin"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </LMSShell>
    );
}


