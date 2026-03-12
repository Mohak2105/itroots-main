"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { CaretLeft, CaretRight, CalendarDots, Plus, Clock, BookOpen, Link as LinkIcon, PencilSimple, X } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./calendar.module.css";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BATCH_COLORS = ["#0881ec", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

const emptyForm = {
    id: "",
    title: "",
    courseId: "",
    batchId: "",
    scheduledAt: "",
    meetingLink: "",
    description: "",
};

const toInputDateTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

const sameDate = (date: Date, value: string) => {
    const eventDate = new Date(value);
    return eventDate.getFullYear() === date.getFullYear()
        && eventDate.getMonth() === date.getMonth()
        && eventDate.getDate() === date.getDate();
};

export default function FacultyCalendarPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [batches, setBatches] = useState<any[]>([]);
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    const fetchData = async () => {
        if (!token) return;
        try {
            const [batchRes, liveClassRes] = await Promise.all([
                fetch(ENDPOINTS.Faculty.MY_BATCHES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.Faculty.LIVE_CLASSES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [batchData, liveClassData] = await Promise.all([batchRes.json(), liveClassRes.json()]);
            setBatches(Array.isArray(batchData) ? batchData : []);
            setLiveClasses(Array.isArray(liveClassData) ? liveClassData : []);
        } catch (error) {
            console.error("Failed to fetch live class data", error);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [token]);

    const courses = useMemo(() => {
        const seen = new Map<string, any>();
        batches.forEach((batch) => {
            if (batch.course?.id && !seen.has(batch.course.id)) {
                seen.set(batch.course.id, batch.course);
            }
        });
        return Array.from(seen.values());
    }, [batches]);

    const filteredBatches = useMemo(
        () => batches.filter((batch) => !formData.courseId || batch.courseId === formData.courseId),
        [batches, formData.courseId]
    );

    const colorByBatchId = useMemo(() => {
        const map = new Map<string, string>();
        batches.forEach((batch, index) => {
            map.set(batch.id, BATCH_COLORS[index % BATCH_COLORS.length]);
        });
        return map;
    }, [batches]);

    if (isLoading || !user) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();

    const prev = () => setCurrentDate(new Date(year, month - 1, 1));
    const next = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelected = (day: number) =>
        day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    const getEventsForDate = (date: Date) => liveClasses
        .filter((item) => sameDate(date, item.scheduledAt))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .map((item) => ({
            ...item,
            time: new Date(item.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
            color: colorByBatchId.get(item.batchId) || BATCH_COLORS[0],
        }));

    const selectedEvents = getEventsForDate(selectedDate);

    const openCreateModal = () => {
        const defaultBatch = batches[0];
        const selectedDateSeed = new Date(selectedDate);
        selectedDateSeed.setHours(10, 0, 0, 0);
        setFormData({
            ...emptyForm,
            courseId: defaultBatch?.courseId || "",
            batchId: defaultBatch?.id || "",
            scheduledAt: toInputDateTime(selectedDateSeed.toISOString()),
        });
        setShowModal(true);
    };

    const openEditModal = (event: any) => {
        setFormData({
            id: event.id,
            title: event.title,
            courseId: event.courseId,
            batchId: event.batchId,
            scheduledAt: toInputDateTime(event.scheduledAt),
            meetingLink: event.meetingLink,
            description: event.description || "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(emptyForm);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = formData.id ? `${ENDPOINTS.Faculty.LIVE_CLASSES}/${formData.id}` : ENDPOINTS.Faculty.LIVE_CLASSES;
            const method = formData.id ? "PUT" : "POST";
            const res = await fetch(endpoint, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Unable to save live class");
            }
            closeModal();
            void fetchData();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to save live class");
        }
    };

    const handleCancelClass = async (liveClassId: string) => {
        if (!confirm("Cancel this live class?")) return;
        try {
            const res = await fetch(ENDPOINTS.Faculty.CANCEL_LIVE_CLASS(liveClassId), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <LMSShell pageTitle="Event Calendar">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Live Class Calendar</div>
                        <div className={styles.bannerSub}>Schedule, edit, and cancel live classes for your assigned batches.</div>
                    </div>
                    <CalendarDots size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.calLayout}>
                    <div className={styles.calendarCard}>
                        <div className={styles.calHeader}>
                            <button className={styles.navBtn} onClick={prev}>
                                <CaretLeft size={18} weight="bold" />
                            </button>
                            <div className={styles.calMonthGroup}>
                                <span className={styles.calMonth}>{MONTH_NAMES[month]} {year}</span>
                                <button className={styles.todayBtn} onClick={goToday}>Today</button>
                            </div>
                            <button className={styles.navBtn} onClick={next}>
                                <CaretRight size={18} weight="bold" />
                            </button>
                        </div>

                        <div className={styles.weekRow}>
                            {WEEK_DAYS.map((day) => (
                                <div key={day} className={styles.weekLabel}>{day}</div>
                            ))}
                        </div>

                        <div className={styles.daysGrid}>
                            {Array.from({ length: firstDay }).map((_, index) => (
                                <div key={`empty-${index}`} className={styles.dayCell} />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const date = new Date(year, month, day);
                                const events = getEventsForDate(date);
                                const todayCell = isToday(day);
                                const selectedCell = isSelected(day) && !todayCell;

                                return (
                                    <div
                                        key={day}
                                        className={`${styles.dayCell} ${styles.dayCellClickable} ${todayCell ? styles.todayCell : ""} ${selectedCell ? styles.selectedCell : ""}`}
                                        onClick={() => setSelectedDate(new Date(year, month, day))}
                                    >
                                        <span className={styles.dayNum}>{day}</span>
                                        {events.length > 0 ? (
                                            <div className={styles.eventDots}>
                                                {events.slice(0, 3).map((event, dotIndex) => (
                                                    <span key={`${event.id}-${dotIndex}`} className={styles.dot} style={{ background: event.status === "CANCELLED" ? "#ef4444" : event.color }} />
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        {batches.length > 0 ? (
                            <div className={styles.legend}>
                                {batches.map((batch) => (
                                    <div key={batch.id} className={styles.legendItem}>
                                        <span className={styles.legendDot} style={{ background: colorByBatchId.get(batch.id) || BATCH_COLORS[0] }} />
                                        <span className={styles.legendLabel}>{batch.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className={styles.eventsPanel}>
                        <div className={styles.eventsPanelHeader}>
                            <div>
                                <div className={styles.eventsPanelDay}>{selectedDate.toLocaleDateString("en-IN", { weekday: "long" })}</div>
                                <div className={styles.eventsPanelDate}>{selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                            </div>
                            <button className={styles.addEventBtn} onClick={openCreateModal}>
                                <Plus size={14} weight="bold" /> Add
                            </button>
                        </div>

                        <div className={styles.eventsBody}>
                            {selectedEvents.length === 0 ? (
                                <div className={styles.noEvents}>
                                    <CalendarDots size={44} color="#cbd5e1" weight="duotone" />
                                    <p>No live classes on this day</p>
                                </div>
                            ) : (
                                <div className={styles.eventsList}>
                                    {selectedEvents.map((event) => (
                                        <div key={event.id} className={styles.eventItem}>
                                            <div className={styles.eventAccent} style={{ background: event.status === "CANCELLED" ? "#ef4444" : event.color }} />
                                            <div className={styles.eventInfo} style={{ width: "100%" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                                                    <div className={styles.eventTitle}>{event.title}</div>
                                                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: "999px", background: event.status === "CANCELLED" ? "#fee2e2" : "#dcfce7", color: event.status === "CANCELLED" ? "#b91c1c" : "#166534" }}>{event.status}</span>
                                                </div>
                                                <div className={styles.eventMeta}><BookOpen size={12} /><span>{event.course?.title} / {event.batch?.name}</span></div>
                                                <div className={styles.eventMeta}><Clock size={12} /><span>{event.time}</span></div>
                                                <div className={styles.eventMeta}><LinkIcon size={12} /><a href={event.meetingLink} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Join link</a></div>
                                                {event.description ? <div className={styles.eventMeta}><span>{event.description}</span></div> : null}
                                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.65rem" }}>
                                                    <button onClick={() => openEditModal(event)} style={{ border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", borderRadius: "8px", padding: "0.4rem 0.7rem", fontWeight: 600, fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                                                        <PencilSimple size={14} /> Edit
                                                    </button>
                                                    {event.status !== "CANCELLED" ? (
                                                        <button onClick={() => handleCancelClass(event.id)} style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", padding: "0.4rem 0.7rem", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>
                                                            Cancel
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showModal ? (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
                    <div style={{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "22px", padding: "2rem", position: "relative", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)" }}>
                        <button onClick={closeModal} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", border: "none", background: "#f8fafc", width: "38px", height: "38px", borderRadius: "999px", cursor: "pointer", color: "#64748b" }}>
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem" }}>{formData.id ? "Edit Live Class" : "Create Live Class"}</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Class Title</label>
                                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Select Course</label>
                                    <select required value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value, batchId: "" })} style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                                        <option value="">Select course</option>
                                        {courses.map((course: any) => <option key={course.id} value={course.id}>{course.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Select Batch</label>
                                    <select required value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                                        <option value="">Select batch</option>
                                        {filteredBatches.map((batch: any) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Date and Time</label>
                                <input type="datetime-local" required value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Meeting Link</label>
                                <input required value={formData.meetingLink} onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Description / Agenda</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1", resize: "vertical" }} />
                            </div>
                            <button type="submit" style={{ marginTop: "0.5rem", border: "none", background: "linear-gradient(135deg, #0c2d4c 0%, #0881ec 100%)", color: "#fff", borderRadius: "999px", padding: "0.95rem", fontWeight: 700, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
                                {formData.id ? "Save Live Class" : "Create Live Class"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}

