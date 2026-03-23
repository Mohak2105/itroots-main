"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Plus, BookOpen, Link as LinkIcon, PencilSimple, X, VideoCamera, Bell, CalendarBlank, CaretDown, Trash } from "@/components/icons/lucide-phosphor";
import { ENDPOINTS } from "@/config/api";
import { getLiveClassAccessState, getLiveClassProviderLabel, resolveLiveClassJoinTarget } from "@/utils/liveClasses";
import styles from "./calendar.module.css";

const BATCH_COLORS = ["#0881ec", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
const isBrowser = typeof window !== "undefined";

const emptyForm = {
    id: "",
    title: "",
    courseId: "",
    batchId: "",
    scheduledAt: "",
    provider: "JITSI",
    meetingLink: "",
    passcode: "",
    description: "",
};

const toInputDateTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

const buildImmediateScheduledAt = () => toInputDateTime(new Date().toISOString());
const toDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const formatDate = (value: string) =>
    parseLocalDate(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

export default function FacultyCalendarPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [nowTick, setNowTick] = useState(() => Date.now());
    const [batches, setBatches] = useState<any[]>([]);
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => toDateValue(new Date()));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePopoverDirection, setDatePopoverDirection] = useState<"down" | "up">("down");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!datePickerRef.current?.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener("pointerdown", handlePointerDown);
        }

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [showDatePicker]);

    useEffect(() => {
        if (!showDatePicker || !datePickerRef.current) return;

        const bounds = datePickerRef.current.getBoundingClientRect();
        const estimatedPopoverHeight = 360;
        const spaceBelow = window.innerHeight - bounds.bottom;
        const spaceAbove = bounds.top;

        setDatePopoverDirection(spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow ? "up" : "down");
    }, [showDatePicker]);

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

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    const colorByBatchId = useMemo(() => {
        const map = new Map<string, string>();
        batches.forEach((batch, index) => {
            map.set(batch.id, BATCH_COLORS[index % BATCH_COLORS.length]);
        });
        return map;
    }, [batches]);

    const liveClassItems = useMemo(
        () =>
            liveClasses
                .filter((item) => {
                    const scheduledDate = new Date(item.scheduledAt);
                    if (Number.isNaN(scheduledDate.getTime())) return false;
                    return toDateValue(scheduledDate) === selectedDate;
                })
                .slice()
                .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                .map((item) => ({
                    ...item,
                    color: colorByBatchId.get(item.batchId) || BATCH_COLORS[0],
                })),
        [liveClasses, colorByBatchId, selectedDate],
    );

    if (isLoading || !user) return null;

    const openCreateModal = () => {
        const defaultBatch = batches[0];
        setFormData({
            ...emptyForm,
            courseId: defaultBatch?.courseId || "",
            batchId: defaultBatch?.id || "",
            scheduledAt: buildImmediateScheduledAt(),
            provider: "JITSI",
        });
        setShowModal(true);
    };

    const openEditModal = (event: any) => {
        setFormData({
            id: event.id,
            title: event.title,
            courseId: event.courseId,
            batchId: event.batchId,
            scheduledAt: buildImmediateScheduledAt(),
            provider: event.provider || "EXTERNAL",
            meetingLink: event.meetingLink || "",
            passcode: event.zoomPasscode || "",
            description: event.description || "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(emptyForm);
    };

    const handleBatchChange = (value: string) => {
        const selectedBatch = batches.find((batch) => batch.id === value);
        setFormData((current) => ({
            ...current,
            batchId: value,
            courseId: selectedBatch?.courseId || "",
        }));
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const endpoint = formData.id ? `${ENDPOINTS.Faculty.LIVE_CLASSES}/${formData.id}` : ENDPOINTS.Faculty.LIVE_CLASSES;
            const method = formData.id ? "PUT" : "POST";
            const selectedBatch = batches.find((batch) => batch.id === formData.batchId);
            const payload = {
                ...formData,
                courseId: selectedBatch?.courseId || formData.courseId,
                scheduledAt: new Date().toISOString(),
                meetingLink: formData.provider === "JITSI" ? "" : formData.meetingLink,
                passcode: formData.provider === "ZOOM" ? formData.passcode : "",
            };
            const response = await fetch(endpoint, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
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
            const response = await fetch(ENDPOINTS.Faculty.CANCEL_LIVE_CLASS(liveClassId), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                void fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const compactModalLayout = isBrowser && window.innerWidth <= 640;

    return (
        <LMSShell pageTitle="Live Classes">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Live Classes</div>
                        <div className={styles.bannerSub}>Create, edit, and start live classes.</div>
                    </div>
                    <VideoCamera size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                

                <div className={styles.classesCard}>
                    <div className={styles.classesHeader}>
                        <div>
                            <div className={styles.classesTitle}>Live class sessions</div>
                            <div className={styles.classesSub}>Select a date to view the live classes scheduled for that day.</div>
                        </div>
                        <div className={styles.filterBar}>
                        <div className={styles.dateWrap}>
                            
                            <div className={styles.datePickerWrap} ref={datePickerRef}>
                                <button
                                    type="button"
                                    className={styles.dateField}
                                    onClick={() => setShowDatePicker((current) => !current)}
                                    aria-expanded={showDatePicker}
                                >
                                    <CalendarBlank size={18} weight="duotone" />
                                    <span className={styles.dateValue}>{formatDate(selectedDate)}</span>
                                    <CaretDown size={16} weight="bold" className={styles.dateCaret} />
                                </button>
                                {showDatePicker ? (
                                    <div className={`${styles.datePopover} ${datePopoverDirection === "up" ? styles.datePopoverUp : ""}`}>
                                        <Calendar
                                            onChange={(value) => {
                                                const nextDate = Array.isArray(value) ? value[0] : value;
                                                if (nextDate instanceof Date && !Number.isNaN(nextDate.getTime())) {
                                                    setSelectedDate(toDateValue(nextDate));
                                                    setShowDatePicker(false);
                                                }
                                            }}
                                            value={parseLocalDate(selectedDate)}
                                            maxDetail="month"
                                            className={styles.reactCalendar}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                        <button
                            className={styles.addEventBtn}
                            onClick={openCreateModal}
                            data-testid="open-live-class-modal"
                            disabled={!batches.length}
                        >
                            <Plus size={14} weight="bold" /> Create Live Class
                        </button>
                    </div>

                    

                    <div className={styles.classesBody}>
                        {liveClassItems.length === 0 ? (
                            <div className={styles.noEvents}>
                                <VideoCamera size={44} color="#cbd5e1" weight="duotone" />
                                <p>No live classes found for {formatDate(selectedDate)}.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.classesTable}>
                                    <thead>
                                        <tr>
                                            <th>Live Class</th>
                                            <th>Provider</th>
                                            <th>Status</th>
                                           
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {liveClassItems.map((event) => {
                                            const joinTarget = resolveLiveClassJoinTarget(event, "TEACHER");
                                            const accessState = getLiveClassAccessState(event, nowTick);
                                            const joinDisabledLabel = accessState === "NOT_STARTED"
                                                ? "Join opens after start"
                                                : accessState === "EXPIRED"
                                                    ? "Session Expired"
                                                    : accessState === "COMPLETED"
                                                        ? "Class Ended"
                                                        : event.status === "CANCELLED"
                                                            ? "Class Cancelled"
                                                            : "Join Unavailable";

                                            return (
                                                <tr key={event.id}>
                                                    <td>
                                                        <div className={styles.titleCell}>
                                                            <span
                                                                className={styles.titleAccent}
                                                                style={{ background: event.status === "CANCELLED" ? "#ef4444" : event.color }}
                                                            />
                                                            <div>
                                                                <div className={styles.eventTitle}>{event.title}</div>
                                                                <div className={styles.courseMeta}>
                                                                    <BookOpen size={13} />
                                                                    <span>{event.course?.title} / {event.batch?.name}</span>
                                                                </div>
                                                                {event.description ? (
                                                                    <div className={styles.descriptionMeta}>{event.description}</div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.providerCell}>
                                                            <LinkIcon size={13} />
                                                            <span>{getLiveClassProviderLabel(event.provider)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`${styles.statusBadge} ${event.status === "CANCELLED" ? styles.statusDanger : event.status === "COMPLETED" ? styles.statusMuted : styles.statusSuccess}`}
                                                        >
                                                            {event.status}
                                                        </span>
                                                    </td>
                                                    
                                                    <td>
                                                        <div className={styles.eventActions}>
                                                            {accessState === "AVAILABLE" && joinTarget.href ? (
                                                                joinTarget.external ? (
                                                                    <a
                                                                        href={joinTarget.href}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={`${styles.actionIconBtn} ${styles.openBtn}`}
                                                                        title="Open Live Class"
                                                                        aria-label="Open Live Class"
                                                                    >
                                                                        <LinkIcon size={18} />
                                                                    </a>
                                                                ) : (
                                                                    <Link
                                                                        href={joinTarget.href}
                                                                        className={`${styles.actionIconBtn} ${styles.openBtn}`}
                                                                        title="Open Live Class"
                                                                        aria-label="Open Live Class"
                                                                    >
                                                                        <LinkIcon size={18} />
                                                                    </Link>
                                                                )
                                                            ) : (
                                                                <span
                                                                    className={`${styles.actionIconBtn} ${styles.disabledActionBtn}`}
                                                                    title={joinDisabledLabel}
                                                                    aria-label={joinDisabledLabel}
                                                                >
                                                                    <LinkIcon size={18} />
                                                                </span>
                                                            )}

                                                            <button
                                                                onClick={() => openEditModal(event)}
                                                                className={`${styles.actionIconBtn} ${styles.editBtn}`}
                                                                title="Edit Live Class"
                                                                aria-label="Edit Live Class"
                                                            >
                                                                <PencilSimple size={18} />
                                                            </button>

                                                            {event.status !== "CANCELLED" ? (
                                                                <button
                                                                    onClick={() => handleCancelClass(event.id)}
                                                                    className={`${styles.actionIconBtn} ${styles.cancelBtn}`}
                                                                    title="Cancel Live Class"
                                                                    aria-label="Cancel Live Class"
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal ? (
                <div className={styles.modalOverlay}>
                    <div
                        data-testid="live-class-form-modal"
                        className={styles.modalCard}
                        style={{
                            borderRadius: compactModalLayout ? "16px" : "22px",
                            padding: compactModalLayout ? "1.15rem" : "2rem",
                        }}
                    >
                        <button onClick={closeModal} className={styles.modalCloseBtn}>
                            <X size={20} />
                        </button>
                        <h3 className={styles.modalTitle}>{formData.id ? "Edit Live Class" : "Create Live Class"}</h3>

                        <div className={styles.modalInfo}>
                            This live class will start immediately after you save it, and students will get a notification right away.
                        </div>

                        <form onSubmit={handleSave} className={styles.modalForm}>
                            <div>
                                <label className={styles.inputLabel}>Class Title</label>
                                <input
                                    data-testid="live-class-title-input"
                                    required
                                    value={formData.title}
                                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                                    className={styles.inputField}
                                />
                            </div>

                            <div>
                                <label className={styles.inputLabel}>Select Batch</label>
                                <CustomSelect
                                    value={formData.batchId}
                                    onChange={handleBatchChange}
                                    placeholder="Select batch"
                                    required
                                    testId="live-class-batch"
                                    options={[
                                        { value: "", label: "Select batch" },
                                        ...batches.map((batch: any) => ({ value: batch.id, label: batch.name })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className={styles.inputLabel}>Meeting Provider</label>
                                <CustomSelect
                                    value={formData.provider}
                                    onChange={(value) => setFormData({ ...formData, provider: value })}
                                    testId="live-class-provider"
                                    options={[
                                        { value: "JITSI", label: "Jitsi Meeting" },
                                        { value: "ZOOM", label: "Zoom Meeting" },
                                        { value: "EXTERNAL", label: "External Link" },
                                    ]}
                                />
                            </div>

                            {formData.provider === "JITSI" ? (
                                <div className={styles.providerNotice}>
                                    A secure Jitsi room will be created automatically inside the LMS. Teachers and students join from the live class page as soon as this class is saved.
                                </div>
                            ) : (
                                <div>
                                    <label className={styles.inputLabel}>{formData.provider === "ZOOM" ? "Zoom Join Link" : "Meeting Link"}</label>
                                    <input
                                        data-testid="live-class-meeting-link-input"
                                        required
                                        value={formData.meetingLink}
                                        onChange={(event) => setFormData({ ...formData, meetingLink: event.target.value })}
                                        placeholder={formData.provider === "ZOOM" ? "https://us06web.zoom.us/j/..." : "https://meet.google.com/..."}
                                        className={styles.inputField}
                                    />
                                </div>
                            )}

                            {formData.provider === "ZOOM" ? (
                                <div>
                                    <label className={styles.inputLabel}>Passcode</label>
                                    <input
                                        data-testid="live-class-passcode-input"
                                        value={formData.passcode}
                                        onChange={(event) => setFormData({ ...formData, passcode: event.target.value })}
                                        placeholder="Optional if your Zoom link already includes it"
                                        className={styles.inputField}
                                    />
                                </div>
                            ) : null}

                            <div>
                                <label className={styles.inputLabel}>Description / Agenda</label>
                                <textarea
                                    data-testid="live-class-description-input"
                                    value={formData.description}
                                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                    rows={2}
                                    className={styles.textareaField}
                                />
                            </div>

                            <button data-testid="save-live-class" type="submit" className={styles.saveBtn}>
                                {formData.id ? "Save Live Class" : "Create Live Class"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
