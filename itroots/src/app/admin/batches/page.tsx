"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Calendar as CalendarIcon, X, Plus, Trash, PencilSimple, UsersThree, Clock } from "@phosphor-icons/react";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { ENDPOINTS } from "@/config/api";
import styles from "../dashboard/admin-dashboard.module.css";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import { showDeleteConfirmation } from "@/utils/toastUtils";

interface CourseInfo {
    id: string;
    title: string;
}

interface BatchRecord {
    id: string;
    name: string;
    courseId: string;
    FacultyId: string;
    schedule: string;
    startDate: string;
    endDate: string;
    course?: { title: string };
    Faculty?: { name: string; specialization?: string };
    students?: Array<{ id: string }>;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const EMPTY_BATCH = {
    id: "",
    name: "",
    courseId: "",
    FacultyId: "",
    days: [] as string[],
    timeFrom: "",
    timeTo: "",
    startDate: "",
    endDate: "",
};

const formatDate = (value?: string) => {
    if (!value) return "";
    const [datePart] = String(value).split("T");
    return datePart || "";
};

const formatDateDisplay = (value?: string) => {
    if (!value) return "Not set";
    const d = new Date(value);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Parse schedule string like "Mon, Wed, Fri - 10:00 AM to 12:00 PM" into { days, timeFrom, timeTo } */
const parseSchedule = (schedule: string) => {
    if (!schedule) return { days: [] as string[], timeFrom: "", timeTo: "" };
    const parts = schedule.split(" - ");
    const daysPart = parts[0] || "";
    const timePart = parts[1] || "";
    const days = daysPart.split(",").map((d) => d.trim()).filter(Boolean);
    const timeParts = timePart.split(" to ");
    return { days, timeFrom: timeParts[0]?.trim() || "", timeTo: timeParts[1]?.trim() || "" };
};

/** Combine days array + time slot into schedule string */
const buildSchedule = (days: string[], timeFrom: string, timeTo: string) => {
    const slot = timeFrom && timeTo ? `${timeFrom} to ${timeTo}` : timeFrom || timeTo || "";
    if (days.length === 0 && !slot) return "";
    return `${days.join(", ")}${slot ? ` - ${slot}` : ""}`;
};

/* ---- Calendar Picker Component ---- */
function CalendarPicker({
    label,
    value,
    onChange,
    required,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const dateValue = value ? new Date(value + "T00:00:00") : undefined;

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>{label}</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    background: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: value ? "#1e293b" : "#94a3b8",
                }}
            >
                {value ? formatDateDisplay(value) : "Select date"}
                <CalendarIcon size={18} color="#64748b" />
            </button>
            {required && <input type="text" required value={value} onChange={() => { }} style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} tabIndex={-1} />}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 1100,
                        background: "#fff",
                        borderRadius: "14px",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                    }}
                >
                    <ReactCalendar
                        value={dateValue}
                        onChange={(val) => {
                            if (val instanceof Date) {
                                const y = val.getFullYear();
                                const m = String(val.getMonth() + 1).padStart(2, "0");
                                const d = String(val.getDate()).padStart(2, "0");
                                onChange(`${y}-${m}-${d}`);
                            }
                            setOpen(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/* ---- Custom Time Picker Component ---- */
function TimePicker({
    label,
    subLabel,
    value,
    onChange,
}: {
    label?: string;
    subLabel?: string;
    value: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Parse current value like "10:30 AM"
    const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const selHour = match ? match[1] : "";
    const selMin = match ? match[2] : "";
    const selAmpm = match ? match[3].toUpperCase() : "AM";

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    const updateTime = (h: string, m: string, ap: string) => {
        if (h && m) onChange(`${h}:${m} ${ap}`);
    };

    const itemStyle = (active: boolean): React.CSSProperties => ({
        padding: "0.4rem 0.7rem",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: active ? 700 : 500,
        background: active ? "#0881ec" : "transparent",
        color: active ? "#fff" : "#334155",
        border: "none",
        width: "100%",
        textAlign: "center" as const,
        transition: "all 0.12s ease",
    });

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            {label && <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>{label}</label>}
            {subLabel && <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>{subLabel}</span>}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    background: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: value ? "#1e293b" : "#94a3b8",
                }}
            >
                {value || "Select time"}
                <Clock size={18} color="#64748b" />
            </button>
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 1100,
                        background: "#fff",
                        borderRadius: "14px",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                        border: "1px solid #e2e8f0",
                        padding: "0.75rem",
                        display: "flex",
                        gap: "0.5rem",
                        width: "260px",
                    }}
                >
                    {/* Hour column */}
                    <div style={{ flex: 1, maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center", marginBottom: "4px" }}>Hour</span>
                        {hours.map((h) => (
                            <button key={h} type="button" style={itemStyle(selHour === h)} onClick={() => { updateTime(h, selMin || "00", selAmpm); }}>{h}</button>
                        ))}
                    </div>
                    {/* Minute column */}
                    <div style={{ flex: 1, maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center", marginBottom: "4px" }}>Min</span>
                        {minutes.map((m) => (
                            <button key={m} type="button" style={itemStyle(selMin === m)} onClick={() => { updateTime(selHour || "12", m, selAmpm); }}>{m}</button>
                        ))}
                    </div>
                    {/* AM/PM column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", justifyContent: "flex-start" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center", marginBottom: "4px" }}>&nbsp;</span>
                        {["AM", "PM"].map((ap) => (
                            <button key={ap} type="button" style={{ ...itemStyle(selAmpm === ap), padding: "0.5rem 0.8rem" }} onClick={() => { updateTime(selHour || "12", selMin || "00", ap); }}>{ap}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Styles for calendar overrides ---- */
const calendarOverrideCSS = `
.react-calendar {
    border: none !important;
    font-family: 'Outfit', 'Inter', sans-serif !important;
    width: 300px !important;
    padding: 0.5rem;
}
.react-calendar__tile--active {
    background: #0881ec !important;
    border-radius: 8px !important;
    color: #fff !important;
}
.react-calendar__tile--now {
    background: rgba(8,129,236,0.1) !important;
    border-radius: 8px !important;
}
.react-calendar__tile:hover {
    background: #e0f2fe !important;
    border-radius: 8px !important;
}
.react-calendar__navigation button:hover {
    background: #f1f5f9 !important;
    border-radius: 8px !important;
}
.react-calendar__month-view__weekdays {
    font-weight: 700 !important;
    font-size: 0.7rem !important;
    color: #94a3b8 !important;
    text-transform: uppercase !important;
}
.react-calendar__month-view__weekdays abbr {
    text-decoration: none !important;
}
`;

export default function AdminBatchesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<BatchRecord[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [fetchError, setFetchError] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [batchForm, setBatchForm] = useState(EMPTY_BATCH);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsFetching(true);
        setFetchError("");
        try {
            const [bRes, cRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.BATCHES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (!bRes.ok || !cRes.ok) {
                const [batchError, courseError] = await Promise.all([
                    bRes.json().catch(() => null),
                    cRes.json().catch(() => null),
                ]);

                throw new Error(
                    batchError?.message
                    || courseError?.message
                    || "Unable to load batch data from the backend."
                );
            }

            const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
            setBatches(Array.isArray(bData) ? bData : []);
            setCourses(Array.isArray(cData) ? cData : []);
        } catch (err) {
            console.error("Fetch error:", err);
            setFetchError(
                err instanceof Error
                    ? err.message
                    : "Backend API is not reachable. Please make sure the backend server is running on port 5000."
            );
        } finally {
            setIsFetching(false);
        }
    }, [token]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    if (isLoading || !user) return null;

    const openCreateModal = () => {
        setBatchForm({
            ...EMPTY_BATCH,
            courseId: courses[0]?.id || "",
            FacultyId: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (batch: BatchRecord) => {
        const { days, timeFrom, timeTo } = parseSchedule(batch.schedule);
        setBatchForm({
            id: batch.id,
            name: batch.name,
            courseId: batch.courseId || "",
            FacultyId: batch.FacultyId || "",
            days,
            timeFrom,
            timeTo,
            startDate: formatDate(batch.startDate),
            endDate: formatDate(batch.endDate),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setBatchForm(EMPTY_BATCH);
    };

    const toggleDay = (day: string) => {
        setBatchForm((prev) => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
        }));
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadToast = toast.loading("Saving batch...");
        try {
            const url = batchForm.id ? `${ENDPOINTS.ADMIN.BATCHES}/${batchForm.id}` : ENDPOINTS.ADMIN.BATCHES;
            const method = batchForm.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: batchForm.name,
                    courseId: batchForm.courseId,
                    FacultyId: batchForm.FacultyId,
                    schedule: buildSchedule(batchForm.days, batchForm.timeFrom, batchForm.timeTo),
                    startDate: batchForm.startDate,
                    endDate: batchForm.endDate,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Unable to save batch");
            }

            toast.dismiss(loadToast);
            toast.success("Batch saved successfully!");
            closeModal();
            void fetchData();
        } catch (err) {
            console.error(err);
            toast.dismiss(loadToast);
            toast.error(err instanceof Error ? err.message : "Unable to save batch");
        }
    };

    const handleDelete = (id: string) => {
        showDeleteConfirmation("Batch", async () => {
            const res = await fetch(`${ENDPOINTS.ADMIN.BATCHES}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error("Unable to delete batch");
            }
            void fetchData();
        });
    };

    return (
        <LMSShell pageTitle="Batch Schedule">
            {/* Calendar style overrides */}
            <style>{calendarOverrideCSS}</style>

            <div className={styles.pageStack}>
                <div className={styles.welcome}>
                    <div>
                        <h2>Batch Schedule</h2>
                        <p>Manage session schedules and cohort timelines.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        style={{ padding: "0.75rem 1.5rem", background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Plus size={16} weight="bold" /> Create New Batch
                    </button>
                </div>

                {fetchError ? (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "14px", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                        <span>{fetchError}</span>
                        <button
                            type="button"
                            onClick={() => void fetchData()}
                            style={{ padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid #fca5a5", background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                    {isFetching ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                            Loading batches...
                        </div>
                    ) : batches.length === 0 ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                            No batches created yet. Click &quot;Create New Batch&quot; to get started.
                        </div>
                    ) : (
                        batches.map((batch) => {
                            const { days, timeFrom, timeTo } = parseSchedule(batch.schedule);
                            return (
                                <div key={batch.id} style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                        <div>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#0881ec", background: "rgba(8,129,236,0.1)", padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase" }}>{batch.course?.title || "Unknown Course"}</span>
                                            <h3 style={{ fontFamily: "Outfit", fontSize: "1.2rem", fontWeight: 800, color: "#0a0f1e", marginTop: "0.5rem" }}>{batch.name}</h3>
                                        </div>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <CalendarIcon size={24} color="#0881ec" />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "80px" }}>Days:</span>
                                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                                {days.length > 0 ? days.map((day) => (
                                                    <span key={day} style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0881ec", background: "rgba(8,129,236,0.08)", padding: "2px 8px", borderRadius: "6px" }}>{day}</span>
                                                )) : <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Not set</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "80px" }}>Time Slot:</span>
                                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                                                {timeFrom && timeTo ? `${timeFrom} – ${timeTo}` : "Not set"}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "80px" }}>Duration:</span>
                                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDateDisplay(batch.startDate)} to {formatDateDisplay(batch.endDate)}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                                        <button onClick={() => openEditModal(batch)} style={{ background: "transparent", border: "1px solid #bfdbfe", color: "#2563eb", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <PencilSimple size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(batch.id)} style={{ background: "transparent", border: "1px solid #fecaca", color: "#ef4444", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Trash size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {isModalOpen ? (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
                        <div style={{ background: "#fff", padding: "2rem", borderRadius: "20px", width: "100%", maxWidth: "720px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
                            <button onClick={closeModal} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                                <X size={24} weight="bold" />
                            </button>

                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#0a0f1e" }}>{batchForm.id ? "Edit Batch" : "Create New Batch"}</h3>

                            <form onSubmit={handleSaveBatch} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {/* Batch Name */}
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Batch Name</label>
                                    <input type="text" required value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="e.g. Full Stack JS Evening" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>

                                {/* Select Course */}
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Select Course</label>
                                    <CustomSelect
                                        options={courses.map((course) => ({ value: course.id, label: course.title }))}
                                        value={batchForm.courseId}
                                        onChange={(val) => setBatchForm({ ...batchForm, courseId: val })}
                                        placeholder="Select a course"
                                        required
                                    />
                                </div>

                                {/* Days */}
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Days</label>
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                        {ALL_DAYS.map((day) => {
                                            const selected = batchForm.days.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    style={{
                                                        padding: "0.5rem 0.9rem",
                                                        borderRadius: "8px",
                                                        border: selected ? "1.5px solid #0881ec" : "1.5px solid #cbd5e1",
                                                        background: selected ? "rgba(8,129,236,0.1)" : "#fff",
                                                        color: selected ? "#0881ec" : "#64748b",
                                                        fontWeight: 700,
                                                        fontSize: "0.8rem",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease",
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time Slot */}
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Time Slot</label>
                                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                        <TimePicker
                                            subLabel="From"
                                            value={batchForm.timeFrom}
                                            onChange={(val) => setBatchForm({ ...batchForm, timeFrom: val })}
                                        />
                                        <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.85rem", marginTop: "1.4rem" }}>–</span>
                                        <TimePicker
                                            subLabel="To"
                                            value={batchForm.timeTo}
                                            onChange={(val) => setBatchForm({ ...batchForm, timeTo: val })}
                                        />
                                    </div>
                                </div>

                                {/* Start Date & End Date with react-calendar */}
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <CalendarPicker
                                        label="Start Date"
                                        value={batchForm.startDate}
                                        onChange={(val) => setBatchForm({ ...batchForm, startDate: val })}
                                        required
                                    />
                                    <CalendarPicker
                                        label="End Date"
                                        value={batchForm.endDate}
                                        onChange={(val) => setBatchForm({ ...batchForm, endDate: val })}
                                        required
                                    />
                                </div>

                                <button type="submit" style={{ marginTop: "1rem", padding: "0.9rem", background: "linear-gradient(135deg, #0c2d4c 0%, #0881ec 100%)", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
                                    {batchForm.id ? "Save Batch" : "Add Batch"}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
        </LMSShell>
    );
}
