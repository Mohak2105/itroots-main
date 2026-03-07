"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Video,
    ClipboardText,
    Exam,
    Plus,
    X,
    ChartBar,
    ArrowLeft,
    MonitorPlay,
    BookOpenText,
    Megaphone,
    CalendarCheck,
    Clock,
    Link as LinkIcon,
    PencilSimple,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./batch-management.module.css";

const EMPTY_LIVE_CLASS_FORM = {
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
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export default function BatchManagementPage() {
    const { batchId } = useParams();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();

    const [data, setData] = useState<any>({ contents: [], tests: [], enrollments: [] });
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [isAddContentModal, setIsAddContentModal] = useState(false);
    const [isCreateTestModal, setIsCreateTestModal] = useState(false);
    const [isAnnouncementModal, setIsAnnouncementModal] = useState(false);
    const [isAttendanceModal, setIsAttendanceModal] = useState(false);
    const [isLiveClassModal, setIsLiveClassModal] = useState(false);

    const [contentForm, setContentForm] = useState({ title: "", description: "", type: "VIDEO", contentUrl: "" });
    const [testForm, setTestForm] = useState({ title: "", description: "", totalMarks: 100, durationMinutes: 60, questions: [] });
    const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "NORMAL" });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
    const [liveClassForm, setLiveClassForm] = useState(EMPTY_LIVE_CLASS_FORM);

    const fetchBatchData = useCallback(async () => {
        if (!token || !batchId) return;
        try {
            const res = await fetch(`${ENDPOINTS.TEACHER.BATCH_DATA}/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setData(json);

            if (json.data?.enrollments) {
                const initRecs: Record<string, string> = {};
                json.data.enrollments.forEach((enrollment: any) => {
                    initRecs[enrollment.student.id] = "PRESENT";
                });
                setAttendanceRecords(initRecs);
            }
        } catch (err) {
            console.error(err);
        }
    }, [token, batchId]);

    const fetchLiveClasses = useCallback(async () => {
        if (!token || !batchId) return;
        try {
            const res = await fetch(ENDPOINTS.TEACHER.LIVE_CLASSES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const items = Array.isArray(json) ? json.filter((item: any) => item.batchId === batchId) : [];
            setLiveClasses(items.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
        } catch (err) {
            console.error(err);
        }
    }, [token, batchId]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "TEACHER")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        void fetchBatchData();
        void fetchLiveClasses();
    }, [fetchBatchData, fetchLiveClasses]);

    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(ENDPOINTS.TEACHER.ADD_CONTENT, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...contentForm, batchId }),
            });
            if (res.ok) {
                setIsAddContentModal(false);
                setContentForm({ title: "", description: "", type: "VIDEO", contentUrl: "" });
                void fetchBatchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(ENDPOINTS.TEACHER.CREATE_TEST, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...testForm, batchId }),
            });
            if (res.ok) {
                setIsCreateTestModal(false);
                setTestForm({ title: "", description: "", totalMarks: 100, durationMinutes: 60, questions: [] });
                void fetchBatchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${ENDPOINTS.TEACHER.BASE}/announcements`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...announcementForm, batchId }),
            });
            if (res.ok) {
                setIsAnnouncementModal(false);
                setAnnouncementForm({ title: "", content: "", priority: "NORMAL" });
                alert("Announcement posted.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const recordsArray = Object.keys(attendanceRecords).map((studentId) => ({
                studentId,
                status: attendanceRecords[studentId],
            }));

            const res = await fetch(`${ENDPOINTS.TEACHER.BASE}/attendance`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ batchId, date: attendanceDate, records: recordsArray }),
            });
            if (res.ok) {
                setIsAttendanceModal(false);
                alert("Attendance saved.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openCreateLiveClass = () => {
        const batch = actualData.batch;
        const now = new Date();
        now.setMinutes(0, 0, 0);
        setLiveClassForm({
            ...EMPTY_LIVE_CLASS_FORM,
            courseId: batch?.course?.id || batch?.courseId || "",
            batchId: String(batchId),
            scheduledAt: toInputDateTime(now.toISOString()),
        });
        setIsLiveClassModal(true);
    };

    const openEditLiveClass = (liveClass: any) => {
        setLiveClassForm({
            id: liveClass.id,
            title: liveClass.title,
            courseId: liveClass.courseId,
            batchId: liveClass.batchId,
            scheduledAt: toInputDateTime(liveClass.scheduledAt),
            meetingLink: liveClass.meetingLink,
            description: liveClass.description || "",
        });
        setIsLiveClassModal(true);
    };

    const closeLiveClassModal = () => {
        setIsLiveClassModal(false);
        setLiveClassForm(EMPTY_LIVE_CLASS_FORM);
    };

    const handleSaveLiveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = liveClassForm.id
                ? `${ENDPOINTS.TEACHER.LIVE_CLASSES}/${liveClassForm.id}`
                : ENDPOINTS.TEACHER.LIVE_CLASSES;
            const method = liveClassForm.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(liveClassForm),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.message || "Unable to save live class");
            }
            closeLiveClassModal();
            void fetchLiveClasses();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Unable to save live class");
        }
    };

    const handleCancelLiveClass = async (liveClassId: string) => {
        if (!confirm("Cancel this live class?")) return;
        try {
            const res = await fetch(ENDPOINTS.TEACHER.CANCEL_LIVE_CLASS(liveClassId), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchLiveClasses();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading || !user) return null;

    const actualData = data.data || { batch: null, contents: [], tests: [], enrollments: [] };
    const scheduledLiveClasses = liveClasses.filter((item) => item.status !== "CANCELLED");

    return (
        <LMSShell pageTitle="Batch Administration">
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={18} /> Dashboard</button>
                <div className={styles.controls} style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                    <button className={styles.primaryBtn} onClick={openCreateLiveClass}>
                        <Video size={18} weight="bold" /> Live Class
                    </button>
                    <button className={styles.primaryBtn} onClick={() => setIsAddContentModal(true)}>
                        <Plus size={18} weight="bold" /> Add Content
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => setIsCreateTestModal(true)}>
                        <Exam size={18} weight="bold" /> New Test
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => setIsAnnouncementModal(true)} style={{ background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1" }}>
                        <Megaphone size={18} weight="bold" /> Announce
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => setIsAttendanceModal(true)} style={{ background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1" }}>
                        <CalendarCheck size={18} weight="bold" /> Attendance
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.mainColumn}>
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <Video size={24} color="#7c3aed" />
                            <h3>Live Class Sessions</h3>
                        </div>
                        <div className={styles.contentList}>
                            {liveClasses.length === 0 ? (
                                <div className={styles.empty}>No live classes scheduled for this batch yet.</div>
                            ) : (
                                liveClasses.map((liveClass) => (
                                    <div key={liveClass.id} className={styles.contentItem}>
                                        <div className={styles.contentIcon} style={{ background: liveClass.status === "CANCELLED" ? "#fef2f2" : "#f5f3ff", color: liveClass.status === "CANCELLED" ? "#dc2626" : "#7c3aed" }}>
                                            <Video size={20} />
                                        </div>
                                        <div className={styles.contentText}>
                                            <h5>{liveClass.title}</h5>
                                            <p>
                                                {new Date(liveClass.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                                {" | "}{liveClass.status}
                                            </p>
                                            {liveClass.description ? <p>{liveClass.description}</p> : null}
                                        </div>
                                        <div className={styles.liveClassActions}>
                                            {liveClass.status !== "CANCELLED" ? (
                                                <a href={liveClass.meetingLink} target="_blank" rel="noreferrer" className={styles.actionBtn}>Join</a>
                                            ) : null}
                                            <button type="button" className={styles.inlineBtn} onClick={() => openEditLiveClass(liveClass)}>
                                                <PencilSimple size={14} /> Edit
                                            </button>
                                            {liveClass.status !== "CANCELLED" ? (
                                                <button type="button" className={styles.inlineDangerBtn} onClick={() => handleCancelLiveClass(liveClass.id)}>
                                                    Cancel
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <MonitorPlay size={24} color="#0881ec" />
                            <h3>Lessons & Coursework</h3>
                        </div>
                        <div className={styles.contentList}>
                            {actualData.contents.filter((content: any) => content.type === "VIDEO").map((content: any) => (
                                <div key={content.id} className={styles.contentItem}>
                                    <div className={styles.contentIcon}><Video size={20} /></div>
                                    <div className={styles.contentText}>
                                        <h5>{content.title}</h5>
                                        <p>{content.description || "Video Lecture"}</p>
                                    </div>
                                    <a href={content.contentUrl} target="_blank" className={styles.actionBtn}>Stream Video</a>
                                </div>
                            ))}
                            {actualData.contents.filter((content: any) => content.type === "VIDEO").length === 0 && <div className={styles.empty}>No videos uploaded yet.</div>}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>
                            <BookOpenText size={24} color="#0ea5e9" />
                            <h3>Assignments & Resources</h3>
                        </div>
                        <div className={styles.contentList}>
                            {actualData.contents.filter((content: any) => content.type !== "VIDEO").map((content: any) => (
                                <div key={content.id} className={styles.contentItem}>
                                    <div className={styles.contentIcon} style={{ background: "#f0f9ff" }}><ClipboardText size={20} color="#0ea5e9" /></div>
                                    <div className={styles.contentText}>
                                        <h5>{content.title}</h5>
                                        <p>{content.type} | {content.description || "File download"}</p>
                                    </div>
                                    <a href={content.contentUrl} target="_blank" className={styles.actionBtn}>Download</a>
                                </div>
                            ))}
                            {actualData.contents.filter((content: any) => content.type !== "VIDEO").length === 0 && <div className={styles.empty}>No assignments or resources uploaded yet.</div>}
                        </div>
                    </section>
                </div>

                <div className={styles.sideColumn}>
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Exam size={20} />
                            <h4>Active Tests</h4>
                        </div>
                        <div className={styles.testList}>
                            {actualData.tests.map((test: any) => (
                                <div key={test.id} className={styles.testItem}>
                                    <div className={styles.testInfo}>
                                        <span>{test.title}</span>
                                        <small>{test.totalMarks} Marks | {test.durationMinutes} min</small>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/lms/teacher/tests/${test.id}/results`)}
                                        className={styles.statBtn}
                                        title="View Results"
                                    >
                                        <ChartBar size={18} />
                                    </button>
                                </div>
                            ))}
                            {actualData.tests.length === 0 && <div className={styles.empty}>No exams created.</div>}
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <CalendarCheck size={20} />
                            <h4>Class Size</h4>
                        </div>
                        <div style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a" }}>{actualData.enrollments?.length || 0}</div>
                            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Students Enrolled</p>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Clock size={20} />
                            <h4>Session Overview</h4>
                        </div>
                        <div className={styles.sessionStats}>
                            <div className={styles.sessionStatItem}>
                                <span className={styles.sessionStatValue}>{scheduledLiveClasses.length}</span>
                                <span className={styles.sessionStatLabel}>Scheduled Sessions</span>
                            </div>
                            <div className={styles.sessionStatItem}>
                                <span className={styles.sessionStatValue}>{liveClasses.filter((item) => item.status === "CANCELLED").length}</span>
                                <span className={styles.sessionStatLabel}>Cancelled Sessions</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {isLiveClassModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{liveClassForm.id ? "Edit Live Class" : "Create Live Class"}</h3>
                            <button onClick={closeLiveClassModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveLiveClass} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Class Title</label>
                                <input required value={liveClassForm.title} onChange={(e) => setLiveClassForm({ ...liveClassForm, title: e.target.value })} placeholder="e.g. React Hooks Session" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date and Time</label>
                                <input type="datetime-local" required value={liveClassForm.scheduledAt} onChange={(e) => setLiveClassForm({ ...liveClassForm, scheduledAt: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Meeting Link</label>
                                <input required value={liveClassForm.meetingLink} onChange={(e) => setLiveClassForm({ ...liveClassForm, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description / Agenda</label>
                                <textarea value={liveClassForm.description} onChange={(e) => setLiveClassForm({ ...liveClassForm, description: e.target.value })} rows={4} placeholder="Topics to be covered in this session" />
                            </div>
                            <button type="submit" className={styles.submitBtn}>{liveClassForm.id ? "Save Live Class" : "Create Live Class"}</button>
                        </form>
                    </div>
                </div>
            )}

            {isAddContentModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Upload Batch Material</h3>
                            <button onClick={() => setIsAddContentModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddContent} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input required value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} placeholder="e.g. Introduction to React" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Type</label>
                                <select value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value })}>
                                    <option value="VIDEO">Video Lecture URL</option>
                                    <option value="ASSIGNMENT">Assignment Link/File</option>
                                    <option value="RESOURCE">Other Resource (PDF, PPT)</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>URL</label>
                                <input required value={contentForm.contentUrl} onChange={e => setContentForm({ ...contentForm, contentUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea value={contentForm.description} onChange={e => setContentForm({ ...contentForm, description: e.target.value })} placeholder="Brief overview..." />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Save</button>
                        </form>
                    </div>
                </div>
            )}

            {isCreateTestModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>New Assessment</h3>
                            <button onClick={() => setIsCreateTestModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateTest} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input required value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Total Marks</label>
                                    <input type="number" required value={testForm.totalMarks} onChange={e => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value) })} />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Duration (Min)</label>
                                    <input type="number" required value={testForm.durationMinutes} onChange={e => setTestForm({ ...testForm, durationMinutes: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <button type="submit" className={styles.submitBtn}>Generate Test</button>
                        </form>
                    </div>
                </div>
            )}

            {isAnnouncementModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Post Announcement</h3>
                            <button onClick={() => setIsAnnouncementModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateAnnouncement} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Subject</label>
                                <input required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select value={announcementForm.priority} onChange={e => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}>
                                    <option value="LOW">Low</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea required value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={5} />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Broadcast to Batch</button>
                        </form>
                    </div>
                </div>
            )}

            {isAttendanceModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: "600px" }}>
                        <div className={styles.modalHeader}>
                            <h3>Mark Attendance</h3>
                            <button onClick={() => setIsAttendanceModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleMarkAttendance} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Date of Class</label>
                                <input type="date" required value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                            </div>

                            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px", marginTop: "1rem" }}>
                                {actualData.enrollments.map((enrollment: any) => (
                                    <div key={enrollment.student.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                                        <div style={{ fontWeight: 600 }}>{enrollment.student.name}</div>
                                        <select
                                            value={attendanceRecords[enrollment.student.id] || "PRESENT"}
                                            onChange={(e) => setAttendanceRecords({ ...attendanceRecords, [enrollment.student.id]: e.target.value })}
                                            style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        >
                                            <option value="PRESENT">Present</option>
                                            <option value="ABSENT">Absent</option>
                                            <option value="LATE">Late</option>
                                        </select>
                                    </div>
                                ))}
                                {actualData.enrollments.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No students enrolled in this batch.</div>}
                            </div>
                            <button type="submit" className={styles.submitBtn} style={{ marginTop: "1rem" }}>Save Attendance Record</button>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
