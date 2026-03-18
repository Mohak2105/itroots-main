"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import toast from "react-hot-toast";
import styles from "./teacher-announcements.module.css";
import {
    Bell,
    CheckCircle,
    MegaphoneSimple,
    PaperPlaneRight,
    Plus,
    Spinner,
    X,
} from "@phosphor-icons/react";

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

type BatchOption = {
    id: string;
    name: string;
    course?: { id?: string; title?: string } | null;
};

type SentNotification = {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    batch?: { id: string; name: string } | null;
    course?: { id: string; title: string } | null;
    recipients?: Array<{
        id: string;
        userId: string;
        readAt?: string | null;
        user?: { id: string; name: string; email: string } | null;
    }>;
};

const NOTIFICATION_TYPE_OPTIONS = [
    { value: "ANNOUNCEMENT", label: "Announcement" },
    { value: "REMINDER", label: "Reminder" },
    { value: "ALERT", label: "Alert" },
    { value: "NOTIFICATION", label: "Notification" },
];

const EMPTY_FORM = {
    title: "",
    message: "",
    type: "ANNOUNCEMENT",
    batchId: "",
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
    const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    const fetchData = async () => {
        if (!token) return;

        setLoadingData(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [notificationsRes, sentRes, batchesRes] = await Promise.all([
                fetch(ENDPOINTS.Faculty.NOTIFICATIONS, { headers }),
                fetch(ENDPOINTS.Faculty.SENT_NOTIFICATIONS, { headers }),
                fetch(ENDPOINTS.Faculty.MY_BATCHES, { headers }),
            ]);

            const [notificationsData, sentData, batchesData] = await Promise.all([
                notificationsRes.json(),
                sentRes.json(),
                batchesRes.json(),
            ]);

            const batchList = Array.isArray(batchesData) ? batchesData : (batchesData?.batches ?? []);
            setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
            setSentNotifications(Array.isArray(sentData) ? sentData : []);
            setBatches(batchList);
            setForm((current) => ({
                ...current,
                batchId: current.batchId || batchList[0]?.id || "",
            }));
        } catch (error) {
            console.error("Failed to fetch Faculty notifications:", error);
            toast.error("Unable to load notifications.");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchData();
        }
    }, [token]);

    const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);
    const sentRecipientCount = useMemo(
        () => sentNotifications.reduce((total, item) => total + (item.recipients?.length || 0), 0),
        [sentNotifications],
    );

    const openCreateModal = () => {
        setForm({
            ...EMPTY_FORM,
            batchId: batches[0]?.id || "",
        });
        setShowModal(true);
    };

    const closeCreateModal = () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setSubmitting(false);
    };

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
            toast.error(error instanceof Error ? error.message : "Unable to mark notification as read");
        } finally {
            setMarkingId(null);
        }
    };

    const handleSendNotification = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        if (!form.batchId) {
            toast.error("Select a batch.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(ENDPOINTS.Faculty.CREATE_NOTIFICATION, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title,
                    message: form.message,
                    type: form.type,
                    batchId: form.batchId,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Unable to send notification");
            }

            toast.success(`Notification sent to ${data?.recipientCount || 0} students.`);
            closeCreateModal();
            await fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Unable to send notification");
        } finally {
            setSubmitting(false);
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
                            Send updates to your batch students and review incoming admin notifications from one place.
                        </div>
                    </div>
                    <div className={styles.bannerActions}>
                        <button type="button" className={styles.createBtn} onClick={openCreateModal}>
                            <Plus size={18} weight="bold" />
                            <span>Send Notification</span>
                        </button>
                        <Bell size={58} color="rgba(255,255,255,0.2)" weight="duotone" />
                    </div>
                </div>

                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{notifications.length}</span>
                        <span className={styles.summaryLabel}>Inbox Notifications</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{unreadCount}</span>
                        <span className={styles.summaryLabel}>Unread</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{sentNotifications.length}</span>
                        <span className={styles.summaryLabel}>Sent by You</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{sentRecipientCount}</span>
                        <span className={styles.summaryLabel}>Students Reached</span>
                    </div>
                </div>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Sent Notifications</h3>
                        <span className={styles.headerMeta}>{sentNotifications.length} records</span>
                    </div>

                    {loadingData ? (
                        <div className={styles.emptyState}>Loading sent notifications...</div>
                    ) : sentNotifications.length === 0 ? (
                        <div className={styles.emptyState}>No notifications sent yet. Use the button above to notify a batch.</div>
                    ) : (
                        <div className={styles.list}>
                            {sentNotifications.map((item) => {
                                const batchName = item.batch?.name || item.course?.title || "Assigned batch";
                                const recipientCount = item.recipients?.length || 0;
                                return (
                                    <div key={item.id} className={styles.item}>
                                        <div className={styles.iconWrap}>
                                            <PaperPlaneRight size={20} weight="fill" />
                                        </div>
                                        <div className={styles.content}>
                                            <div className={styles.topRow}>
                                                <div>
                                                    <div className={styles.title}>{item.title}</div>
                                                    <div className={styles.meta}>
                                                        {item.type} | {batchName}
                                                    </div>
                                                    <div className={styles.meta}>
                                                        Timestamp: {formatTimestamp(item.createdAt)} | Recipients: {recipientCount}
                                                    </div>
                                                </div>
                                                <span className={styles.sentBadge}>Sent</span>
                                            </div>
                                            <div className={styles.message}>{removeMessageTimestamp(item.message)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Notification Feed</h3>
                        <span className={styles.headerMeta}>{notifications.length} records</span>
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

            {showModal && (
                <div className={styles.modalOverlay} onClick={closeCreateModal}>
                    <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Send Notification</h3>
                            <button type="button" className={styles.modalCloseBtn} onClick={closeCreateModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSendNotification} className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Batch</label>
                                    <CustomSelect
                                        options={batches.map((batch) => ({
                                            value: batch.id,
                                            label: batch.name,
                                        }))}
                                        value={form.batchId}
                                        onChange={(value) => setForm((current) => ({ ...current, batchId: value }))}
                                        placeholder="Select batch"
                                        disabled={batches.length === 0}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Type</label>
                                    <CustomSelect
                                        options={NOTIFICATION_TYPE_OPTIONS}
                                        value={form.type}
                                        onChange={(value) => setForm((current) => ({ ...current, type: value }))}
                                        placeholder="Select type"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                    placeholder="e.g. Tomorrow's live class timing updated"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.message}
                                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                    placeholder="Write the message for students in this batch"
                                />
                            </div>

                            <div className={styles.helperText}>
                                This will notify all active students enrolled in the selected batch.
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={submitting || batches.length === 0}>
                                {submitting ? <Spinner size={18} className={styles.spinner} /> : <PaperPlaneRight size={18} weight="bold" />}
                                {submitting ? "Sending..." : "Send Notification"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
