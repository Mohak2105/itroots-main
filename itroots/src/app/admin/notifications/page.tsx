"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./notifications.module.css";
import { BellRinging, PaperPlaneRight, Plus, Trash, X } from "@phosphor-icons/react";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import toast from "react-hot-toast";
import { showDeleteConfirmation } from "@/utils/toastUtils";

type CourseOption = {
    id: string;
    title: string;
    duration?: string;
};

type BatchOption = {
    id: string;
    name: string;
    courseId?: string;
    course?: { title?: string };
};

type NotificationRecord = {
    id: string;
    title: string;
    message: string;
    type: string;
    audienceType: string;
    sendEmail: boolean;
    createdAt: string;
    batch?: { id: string; name: string } | null;
    course?: { id: string; title: string } | null;
    recipients?: Array<{ id: string; user?: { id: string; name: string; role: string } }>;
};

const GROUP_OPTIONS = [
    { value: "ALL_STUDENTS", label: "All Students" },
    { value: "ALL_Faculty", label: "All Faculty" },
    { value: "SELECTED_BATCH", label: "Selected Batch" },
    { value: "SELECTED_COURSE", label: "Selected Course" },
];

const EMPTY_FORM = {
    title: "",
    message: "",
    type: "NOTIFICATION",
    audienceType: "ALL_STUDENTS",
    batchId: "",
    courseId: "",
};

const BATCH_AUDIENCES = new Set(["SELECTED_BATCH"]);
const COURSE_AUDIENCES = new Set(["SELECTED_COURSE"]);

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
    .replace(/Date and Time:[^\n]*\n?/ig, "")
    .trim();

const groupLabel = (value: string) => GROUP_OPTIONS.find((item) => item.value === value)?.label || value;

const ExpandableMessage = ({ message }: { message: string }) => {
    const [expanded, setExpanded] = useState(false);
    const cleanMessage = removeMessageTimestamp(message);
    const isLong = cleanMessage.length > 70;

    if (!isLong) {
        return <div className={styles.tableSecondary}>{cleanMessage}</div>;
    }

    return (
        <div className={styles.tableSecondary} style={expanded ? {} : { display: "flex", alignItems: "center" }}>
            {expanded ? (
                <>
                    {cleanMessage}
                    <button
                        onClick={() => setExpanded(false)}
                        style={{ background: "none", border: "none", color: "#0881ec", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "0 4px", textDecoration: "underline", whiteSpace: "nowrap" }}
                    >
                        Read less
                    </button>
                </>
            ) : (
                <>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", maxWidth: "340px" }}>
                        {cleanMessage.replace(/\n/g, " ")}
                    </span>
                    <button
                        onClick={() => setExpanded(true)}
                        style={{ background: "none", border: "none", color: "#0881ec", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "0 4px", textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                        Read more
                    </button>
                </>
            )}
        </div>
    );
};

export default function AdminNotificationsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [form, setForm] = useState(EMPTY_FORM);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    const fetchData = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [coursesRes, batchesRes, notificationsRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.COURSES, { headers }),
                fetch(ENDPOINTS.ADMIN.BATCHES, { headers }),
                fetch(ENDPOINTS.ADMIN.NOTIFICATIONS, { headers }),
            ]);

            const [coursesData, batchesData, notificationsData] = await Promise.all([
                coursesRes.json(),
                batchesRes.json(),
                notificationsRes.json(),
            ]);

            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setBatches(Array.isArray(batchesData) ? batchesData : []);
            setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (error) {
            console.error("Failed to fetch notification data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchData();
        }
    }, [token]);

    const availableBatches = useMemo(() => {
        if (form.courseId && !BATCH_AUDIENCES.has(form.audienceType)) {
            return batches.filter((item) => item.courseId === form.courseId);
        }
        return batches;
    }, [batches, form.courseId, form.audienceType]);

    const needsBatch = BATCH_AUDIENCES.has(form.audienceType);
    const needsCourse = COURSE_AUDIENCES.has(form.audienceType);

    const resetTargeting = (audienceType: string) => {
        setForm((current) => ({
            ...current,
            audienceType,
            batchId: "",
            courseId: "",
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        if (needsBatch && !form.batchId) {
            toast.error("Select a batch.");
            return;
        }

        if (needsCourse && !form.courseId) {
            toast.error("Select a course.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                message: form.message,
                type: form.type,
                audienceType: form.audienceType,
                batchId: needsBatch ? form.batchId : undefined,
                courseId: needsCourse ? form.courseId : undefined,
            };

            const response = await fetch(ENDPOINTS.ADMIN.NOTIFICATIONS, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Unable to send notification");
            }

            setForm(EMPTY_FORM);
            setShowModal(false);
            await fetchData();
            toast.success(`Notification sent to ${data?.recipientCount || 0} recipients.`);
        } catch (error) {
            console.error("Notification send failed:", error);
            toast.error(error instanceof Error ? error.message : "Unable to send notification");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (notificationId: string) => {
        if (!token) return;

        showDeleteConfirmation("Notification", async () => {
            setDeletingId(notificationId);
            try {
                const response = await fetch(`${ENDPOINTS.ADMIN.NOTIFICATIONS}/${notificationId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.message || "Unable to delete notification");
                }

                setNotifications((current) => current.filter((item) => item.id !== notificationId));
            } catch (error) {
                console.error("Notification delete failed:", error);
                toast.error(error instanceof Error ? error.message : "Unable to delete notification");
            } finally {
                setDeletingId(null);
            }
        });
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Notifications">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Notification Center</div>
                        <div className={styles.bannerSub}>Send notifications for students and Faculty</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", zIndex: 2, position: "relative" }}>
                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            <Plus size={18} weight="bold" />
                            <span>Create Notification</span>
                        </button>
                    </div>
                    <BellRinging size={110} color="rgba(255,255,255,0.08)" weight="duotone" style={{ position: "absolute", right: "-20px", top: "-10px", zIndex: 0 }} />
                </div>

                <section className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3>Notifications</h3>
                        <span className={styles.muted}>{notifications.length} records</span>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Group</th>
                                    <th>Recipients</th>
                                    <th>Timestamp</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr>
                                        <td colSpan={5} className={styles.emptyCell}>Loading notifications...</td>
                                    </tr>
                                ) : notifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={styles.emptyCell}>No notifications sent yet.</td>
                                    </tr>
                                ) : notifications.map((notification) => (
                                    <tr key={notification.id}>
                                        <td>
                                            <div className={styles.tableStack}>
                                                <div className={styles.tablePrimary}>{notification.title}</div>
                                                <ExpandableMessage message={notification.message} />
                                            </div>
                                        </td>
                                        <td>{groupLabel(notification.audienceType)}</td>
                                        <td>{notification.recipients?.length || 0}</td>
                                        <td>{formatTimestamp(notification.createdAt)}</td>
                                        <td className={styles.actionCell}>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                disabled={deletingId === notification.id}
                                                onClick={() => { void handleDelete(notification.id); }}
                                                title="Delete"
                                            >
                                                <Trash size={16} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Create Notification</h3>
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                    placeholder="e.g. New Batch Starts Tomorrow"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.message}
                                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                    placeholder="Write the notification message for the selected group"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Group</label>
                                    <CustomSelect
                                        options={GROUP_OPTIONS}
                                        value={form.audienceType}
                                        onChange={(val) => resetTargeting(val)}
                                        placeholder="Select group"
                                    />
                                </div>
                            </div>

                            {needsBatch && (
                                <div className={styles.formGroup}>
                                    <label>Select Batch</label>
                                    <CustomSelect
                                        options={availableBatches.map((batch) => ({
                                            value: batch.id,
                                            label: `${batch.name}${batch.course?.title ? ` - ${batch.course.title}` : ""}`,
                                        }))}
                                        value={form.batchId}
                                        onChange={(val) => setForm((current) => ({ ...current, batchId: val }))}
                                        placeholder="Choose batch"
                                    />
                                </div>
                            )}

                            {needsCourse && (
                                <div className={styles.formGroup}>
                                    <label>Select Course</label>
                                    <CustomSelect
                                        options={courses.map((course) => ({
                                            value: course.id,
                                            label: `${course.title}${course.duration ? ` - ${course.duration}` : ""}`,
                                        }))}
                                        value={form.courseId}
                                        onChange={(val) => setForm((current) => ({ ...current, courseId: val }))}
                                        placeholder="Choose course"
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                <PaperPlaneRight size={18} weight="bold" />
                                {submitting ? "Sending..." : "Send Notification"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}