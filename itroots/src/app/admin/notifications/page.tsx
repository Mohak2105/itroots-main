"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./notifications.module.css";
import { BellRinging, PaperPlaneRight } from "@phosphor-icons/react";

type UserOption = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
};

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

const TYPE_OPTIONS = [
    { value: "NOTIFICATION", label: "General Notification" },
    { value: "ANNOUNCEMENT", label: "Announcement" },
    { value: "REMINDER", label: "Reminder" },
    { value: "ALERT", label: "Alert" },
    { value: "PLACEMENT", label: "Placement" },
    { value: "FEES", label: "Fees" },
];

const AUDIENCE_OPTIONS = [
    { value: "ALL_STUDENTS", label: "All Students" },
    { value: "ALL_Faculty", label: "All Faculty" },
    { value: "SELECTED_STUDENTS", label: "Selected Students" },
    { value: "SELECTED_Faculty", label: "Selected Faculty" },
    { value: "SELECTED_BATCH", label: "Selected Batch" },
    { value: "SELECTED_BATCH_STUDENTS", label: "Selected Batch + Students" },
    { value: "SELECTED_BATCH_Faculty", label: "Selected Batch + Faculty" },
    { value: "SELECTED_COURSE", label: "Selected Course" },
    { value: "SELECTED_COURSE_STUDENTS", label: "Selected Course + Students" },
    { value: "SELECTED_COURSE_Faculty", label: "Selected Course + Faculty" },
];

const EMPTY_FORM = {
    title: "",
    message: "",
    type: "NOTIFICATION",
    audienceType: "ALL_STUDENTS",
    batchId: "",
    courseId: "",
    recipientIds: [] as string[],
    sendEmail: false,
};

const BATCH_AUDIENCES = new Set(["SELECTED_BATCH", "SELECTED_BATCH_STUDENTS", "SELECTED_BATCH_Faculty"]);
const COURSE_AUDIENCES = new Set(["SELECTED_COURSE", "SELECTED_COURSE_STUDENTS", "SELECTED_COURSE_Faculty"]);
const DIRECT_STUDENT_AUDIENCES = new Set(["SELECTED_STUDENTS"]);
const DIRECT_Faculty_AUDIENCES = new Set(["SELECTED_Faculty"]);

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const audienceLabel = (value: string) => AUDIENCE_OPTIONS.find((item) => item.value === value)?.label || value;
const typeLabel = (value: string) => TYPE_OPTIONS.find((item) => item.value === value)?.label || value;

export default function AdminNotificationsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [form, setForm] = useState(EMPTY_FORM);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
            const [usersRes, coursesRes, batchesRes, notificationsRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.USERS, { headers }),
                fetch(ENDPOINTS.ADMIN.COURSES, { headers }),
                fetch(ENDPOINTS.ADMIN.BATCHES, { headers }),
                fetch(ENDPOINTS.ADMIN.NOTIFICATIONS, { headers }),
            ]);

            const [usersData, coursesData, batchesData, notificationsData] = await Promise.all([
                usersRes.json(),
                coursesRes.json(),
                batchesRes.json(),
                notificationsRes.json(),
            ]);

            setUsers(Array.isArray(usersData) ? usersData : []);
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

    const availableUsers = useMemo(() => {
        if (DIRECT_STUDENT_AUDIENCES.has(form.audienceType)) {
            return users.filter((item) => item.role === "STUDENT" && item.isActive);
        }
        if (DIRECT_Faculty_AUDIENCES.has(form.audienceType)) {
            return users.filter((item) => item.role === "Faculty" && item.isActive);
        }
        return [];
    }, [form.audienceType, users]);

    const availableBatches = useMemo(() => {
        if (form.courseId && !BATCH_AUDIENCES.has(form.audienceType)) {
            return batches.filter((item) => item.courseId === form.courseId);
        }
        return batches;
    }, [batches, form.courseId, form.audienceType]);

    const needsBatch = BATCH_AUDIENCES.has(form.audienceType);
    const needsCourse = COURSE_AUDIENCES.has(form.audienceType);
    const needsUsers = DIRECT_STUDENT_AUDIENCES.has(form.audienceType) || DIRECT_Faculty_AUDIENCES.has(form.audienceType);

    const toggleRecipient = (userId: string) => {
        setForm((current) => ({
            ...current,
            recipientIds: current.recipientIds.includes(userId)
                ? current.recipientIds.filter((id) => id !== userId)
                : [...current.recipientIds, userId],
        }));
    };

    const resetTargeting = (audienceType: string) => {
        setForm((current) => ({
            ...current,
            audienceType,
            batchId: "",
            courseId: "",
            recipientIds: [],
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        if (needsUsers && form.recipientIds.length === 0) {
            alert("Select at least one user.");
            return;
        }

        if (needsBatch && !form.batchId) {
            alert("Select a batch.");
            return;
        }

        if (needsCourse && !form.courseId) {
            alert("Select a course.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                message: form.message,
                type: form.type,
                audienceType: form.audienceType,
                recipientIds: needsUsers ? form.recipientIds : undefined,
                batchId: needsBatch ? form.batchId : undefined,
                courseId: needsCourse ? form.courseId : undefined,
                sendEmail: form.sendEmail,
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
            await fetchData();
            alert(`Notification sent to ${data?.recipientCount || 0} recipients.`);
        } catch (error) {
            console.error("Notification send failed:", error);
            alert(error instanceof Error ? error.message : "Unable to send notification");
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
                        <div className={styles.bannerEyebrow}>COMMUNICATION CENTER</div>
                        <div className={styles.bannerTitle}>Admin notifications for students and Faculty</div>
                        <div className={styles.bannerSub}>Send batch-wise, course-wise, or direct notifications with optional email delivery.</div>
                    </div>
                    <BellRinging size={58} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.grid}>
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Create Notification</h3>
                            <span className={styles.muted}>Real recipients resolved from the database</span>
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
                                    placeholder="Write the notification message for the selected audience"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Notification Type</label>
                                    <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                                        {TYPE_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Audience</label>
                                    <select value={form.audienceType} onChange={(event) => resetTargeting(event.target.value)}>
                                        {AUDIENCE_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {needsBatch ? (
                                <div className={styles.formGroup}>
                                    <label>Select Batch</label>
                                    <select value={form.batchId} onChange={(event) => setForm((current) => ({ ...current, batchId: event.target.value }))}>
                                        <option value="">Choose batch</option>
                                        {availableBatches.map((batch) => (
                                            <option key={batch.id} value={batch.id}>
                                                {batch.name}{batch.course?.title ? ` - ${batch.course.title}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {needsCourse ? (
                                <div className={styles.formGroup}>
                                    <label>Select Course</label>
                                    <select value={form.courseId} onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}>
                                        <option value="">Choose course</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.title}{course.duration ? ` - ${course.duration}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {needsUsers ? (
                                <div className={styles.formGroup}>
                                    <label>Select Users</label>
                                    <div className={styles.userGrid}>
                                        {availableUsers.length === 0 ? (
                                            <div className={styles.userEmpty}>No active users found for this audience.</div>
                                        ) : availableUsers.map((option) => (
                                            <label key={option.id} className={styles.userOption}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.recipientIds.includes(option.id)}
                                                    onChange={() => toggleRecipient(option.id)}
                                                />
                                                <div>
                                                    <div className={styles.userName}>{option.name}</div>
                                                    <div className={styles.userMeta}>{option.email}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <label className={styles.emailToggle}>
                                <input
                                    type="checkbox"
                                    checked={form.sendEmail}
                                    onChange={(event) => setForm((current) => ({ ...current, sendEmail: event.target.checked }))}
                                />
                                <span>Send email together with dashboard notification</span>
                            </label>

                            <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                <PaperPlaneRight size={18} weight="bold" />
                                {submitting ? "Sending..." : "Send Notification"}
                            </button>
                        </form>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Recent Notifications</h3>
                            <span className={styles.muted}>{notifications.length} records</span>
                        </div>

                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Audience</th>
                                        <th>Target</th>
                                        <th>Recipients</th>
                                        <th>Email</th>
                                        <th>Sent On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingData ? (
                                        <tr>
                                            <td colSpan={7} className={styles.emptyCell}>Loading notifications...</td>
                                        </tr>
                                    ) : notifications.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className={styles.emptyCell}>No notifications sent yet.</td>
                                        </tr>
                                    ) : notifications.map((notification) => (
                                        <tr key={notification.id}>
                                            <td>
                                                <div className={styles.tableStack}>
                                                    <div className={styles.tablePrimary}>{notification.title}</div>
                                                    <div className={styles.tableSecondary}>{notification.message}</div>
                                                </div>
                                            </td>
                                            <td><span className={styles.typeBadge}>{typeLabel(notification.type)}</span></td>
                                            <td>{audienceLabel(notification.audienceType)}</td>
                                            <td>
                                                {notification.batch?.name || notification.course?.title || "Global"}
                                            </td>
                                            <td>{notification.recipients?.length || 0}</td>
                                            <td>{notification.sendEmail ? "Yes" : "No"}</td>
                                            <td>{formatDate(notification.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </LMSShell>
    );
}
