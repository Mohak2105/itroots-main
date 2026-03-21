"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import ReactDateTimePicker from "@/components/lms/ReactDateTimePicker";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
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
import { getLiveClassAccessState, getLiveClassProviderLabel, resolveLiveClassJoinTarget } from "@/utils/liveClasses";
import styles from "./batch-management.module.css";

const EMPTY_LIVE_CLASS_FORM = {
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
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const createEmptyTestQuestion = () => ({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
});

const CORRECT_INDEX_BY_LABEL: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const MAX_BULK_QUESTIONS = 50;

const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
};

const parseBulkMcqQuestions = (raw: string) => {
    const input = raw.trim();
    if (!input) {
        throw new Error("Bulk input is empty.");
    }

    const lines = input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines.length) {
        throw new Error("Bulk input is empty.");
    }

    const firstLineLower = lines[0].toLowerCase();
    const isCsv = firstLineLower.includes("question") && firstLineLower.includes(",") && firstLineLower.includes("correct");
    const questions: Array<{ id: string; text: string; options: string[]; correctIndex: number }> = [];

    if (isCsv) {
        const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
        const requiredHeaders = ["question", "option_a", "option_b", "option_c", "option_d", "correct_option"];
        const headerIndex = new Map<string, number>();
        headers.forEach((header, idx) => headerIndex.set(header, idx));

        const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(header));
        if (missingHeaders.length) {
            throw new Error(`Missing CSV header(s): ${missingHeaders.join(", ")}`);
        }

        for (let row = 1; row < lines.length; row += 1) {
            const cols = parseCsvLine(lines[row]);
            const text = String(cols[headerIndex.get("question")!] || "").trim();
            const options = [
                String(cols[headerIndex.get("option_a")!] || "").trim(),
                String(cols[headerIndex.get("option_b")!] || "").trim(),
                String(cols[headerIndex.get("option_c")!] || "").trim(),
                String(cols[headerIndex.get("option_d")!] || "").trim(),
            ];
            const correctLabel = String(cols[headerIndex.get("correct_option")!] || "").trim().toUpperCase();
            const correctIndex = CORRECT_INDEX_BY_LABEL[correctLabel];

            if (!text) throw new Error(`CSV row ${row + 1}: question is required`);
            if (options.some((option) => !option)) throw new Error(`CSV row ${row + 1}: all 4 options are required`);
            if (!Number.isInteger(correctIndex)) throw new Error(`CSV row ${row + 1}: correct_option must be A/B/C/D`);

            questions.push({
                id: `q-${row}`,
                text,
                options,
                correctIndex,
            });
        }
    } else {
        for (let row = 0; row < lines.length; row += 1) {
            const parts = lines[row].split("|").map((part) => part.trim());
            if (parts.length !== 6) {
                throw new Error(`Line ${row + 1}: expected 6 parts (question|A|B|C|D|CorrectOption)`);
            }

            const [text, optionA, optionB, optionC, optionD, correctLabelRaw] = parts;
            const correctLabel = correctLabelRaw.toUpperCase();
            const correctIndex = CORRECT_INDEX_BY_LABEL[correctLabel];

            if (!text) throw new Error(`Line ${row + 1}: question is required`);
            if (!optionA || !optionB || !optionC || !optionD) throw new Error(`Line ${row + 1}: all 4 options are required`);
            if (!Number.isInteger(correctIndex)) throw new Error(`Line ${row + 1}: correct option must be A/B/C/D`);

            questions.push({
                id: `q-${row + 1}`,
                text,
                options: [optionA, optionB, optionC, optionD],
                correctIndex,
            });
        }
    }

    if (!questions.length) {
        throw new Error("At least 1 question is required.");
    }

    if (questions.length > MAX_BULK_QUESTIONS) {
        throw new Error(`Maximum ${MAX_BULK_QUESTIONS} questions are allowed.`);
    }

    return questions;
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
    const [testInputMode, setTestInputMode] = useState<"MANUAL" | "BULK">("MANUAL");
    const [bulkQuestionText, setBulkQuestionText] = useState("");
    const [bulkCsvFileName, setBulkCsvFileName] = useState("");

    const [contentForm, setContentForm] = useState({ title: "", description: "", type: "VIDEO", contentUrl: "", uploadMode: "URL", fileData: "", fileName: "" });
    const [testForm, setTestForm] = useState({ title: "", description: "", totalMarks: 100, durationMinutes: 60, questions: [createEmptyTestQuestion()] });
    const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "NORMAL" });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
    const [liveClassForm, setLiveClassForm] = useState(EMPTY_LIVE_CLASS_FORM);
    const bulkPreview = useMemo(() => {
        if (!bulkQuestionText.trim()) {
            return { count: 0, error: "" };
        }
        try {
            const questions = parseBulkMcqQuestions(bulkQuestionText);
            return { count: questions.length, error: "" };
        } catch (error: any) {
            return { count: 0, error: error?.message || "Invalid bulk format." };
        }
    }, [bulkQuestionText]);

    const fetchBatchData = useCallback(async () => {
        if (!token || !batchId) return;
        try {
            const res = await fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${batchId}`, {
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
            const res = await fetch(ENDPOINTS.Faculty.LIVE_CLASSES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const items = Array.isArray(json) ? json.filter((item: any) => item.batchId === batchId) : [];
            setLiveClasses(items.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
        } catch (err) {
            console.error(err);
        }
    }, [token, batchId]);

    const loadAttendanceForDate = useCallback(async (selectedDate: string) => {
        if (!token || !batchId) return;
        setIsAttendanceModal(true);
        try {
            const response = await fetch(`${ENDPOINTS.Faculty.BASE}/attendance/${batchId}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            const existingRecords = Array.isArray(json?.data) ? json.data : [];
            const nextRecords: Record<string, string> = {};
            (data.data?.enrollments || []).forEach((enrollment: any) => {
                nextRecords[enrollment.student.id] = 'PRESENT';
            });
            existingRecords.forEach((record: any) => {
                if (record.studentId) {
                    nextRecords[record.studentId] = record.status;
                }
            });
            setAttendanceRecords(nextRecords);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAttendanceModal(false);
        }
    }, [token, batchId, data.data?.enrollments]);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        void fetchBatchData();
        void fetchLiveClasses();
    }, [fetchBatchData, fetchLiveClasses]);

    useEffect(() => {
        if (isAttendanceModal) {
            void loadAttendanceForDate(attendanceDate);
        }
    }, [isAttendanceModal, attendanceDate, loadAttendanceForDate]);

    const resetContentForm = () => {
        setContentForm({ title: "", description: "", type: "VIDEO", contentUrl: "", uploadMode: "URL", fileData: "", fileName: "" });
    };

    const handleContentTypeChange = (value: string) => {
        setContentForm((prev: any) => ({
            ...prev,
            type: value,
            uploadMode: value === "VIDEO" ? "URL" : prev.uploadMode,
            contentUrl: value === "VIDEO" ? prev.contentUrl : "",
            fileData: value === "VIDEO" ? "" : prev.fileData,
            fileName: value === "VIDEO" ? "" : prev.fileName,
        }));
    };

    const handleContentFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setContentForm((prev: any) => ({ ...prev, fileData: "", fileName: "" }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setContentForm((prev: any) => ({
                ...prev,
                fileName: file.name,
                fileData: typeof reader.result === "string" ? reader.result : "",
                contentUrl: "",
            }));
        };
        reader.readAsDataURL(file);
    };
    const addTestQuestion = () => {
        setTestForm((prev: any) => ({
            ...prev,
            questions: [...prev.questions, createEmptyTestQuestion()],
        }));
    };

    const removeTestQuestion = (questionId: string) => {
        setTestForm((prev: any) => ({
            ...prev,
            questions: prev.questions.length > 1
                ? prev.questions.filter((question: any) => question.id !== questionId)
                : prev.questions,
        }));
    };

    const updateTestQuestion = (questionId: string, value: string) => {
        setTestForm((prev: any) => ({
            ...prev,
            questions: prev.questions.map((question: any) => (
                question.id === questionId ? { ...question, text: value } : question
            )),
        }));
    };

    const updateTestOption = (questionId: string, optionIndex: number, value: string) => {
        setTestForm((prev: any) => ({
            ...prev,
            questions: prev.questions.map((question: any) => {
                if (question.id !== questionId) return question;
                const nextOptions = [...question.options];
                nextOptions[optionIndex] = value;
                return { ...question, options: nextOptions };
            }),
        }));
    };

    const setCorrectOption = (questionId: string, optionIndex: number) => {
        setTestForm((prev: any) => ({
            ...prev,
            questions: prev.questions.map((question: any) => (
                question.id === questionId ? { ...question, correctIndex: optionIndex } : question
            )),
        }));
    };
    const openAttendanceModal = () => {
        setIsAttendanceModal(true);
        void loadAttendanceForDate(attendanceDate);
    };

    const handleAttendanceStatusChange = (studentId: string, status: string) => {
        setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                batchId,
                title: contentForm.title,
                description: contentForm.description,
                type: contentForm.type,
                contentUrl: contentForm.uploadMode === "URL" ? contentForm.contentUrl : "",
                fileData: contentForm.uploadMode === "FILE" ? contentForm.fileData : "",
                fileName: contentForm.uploadMode === "FILE" ? contentForm.fileName : "",
            };

            const res = await fetch(ENDPOINTS.Faculty.ADD_CONTENT, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setIsAddContentModal(false);
                resetContentForm();
                void fetchBatchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const questionsPayload = testInputMode === "BULK"
                ? parseBulkMcqQuestions(bulkQuestionText)
                : testForm.questions;

            const res = await fetch(ENDPOINTS.Faculty.CREATE_TEST, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...testForm, batchId, questions: questionsPayload }),
            });
            const payload = await res.json().catch(() => null);
            if (res.ok) {
                closeCreateTestModal();
                setTestForm({ title: "", description: "", totalMarks: 100, durationMinutes: 60, questions: [createEmptyTestQuestion()] });
                void fetchBatchData();
                return;
            }
            const message = Array.isArray(payload?.errors) && payload.errors.length
                ? payload.errors.slice(0, 3).join("\n")
                : payload?.message || "Unable to create test";
            alert(message);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Unable to create test");
        }
    };

    const handleBulkCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setBulkCsvFileName("");
            return;
        }
        const text = await file.text();
        setBulkQuestionText(text);
        setBulkCsvFileName(file.name);
    };

    const closeCreateTestModal = () => {
        setIsCreateTestModal(false);
        setTestInputMode("MANUAL");
        setBulkQuestionText("");
        setBulkCsvFileName("");
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${ENDPOINTS.Faculty.BASE}/announcements`, {
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

            const res = await fetch(`${ENDPOINTS.Faculty.BASE}/attendance`, {
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
        now.setSeconds(0, 0);
        setLiveClassForm({
            ...EMPTY_LIVE_CLASS_FORM,
            courseId: batch?.course?.id || batch?.courseId || "",
            batchId: String(batchId),
            scheduledAt: toInputDateTime(now.toISOString()),
            provider: "JITSI",
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
            provider: liveClass.provider || "EXTERNAL",
            meetingLink: liveClass.meetingLink || "",
            passcode: liveClass.zoomPasscode || "",
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
                ? `${ENDPOINTS.Faculty.LIVE_CLASSES}/${liveClassForm.id}`
                : ENDPOINTS.Faculty.LIVE_CLASSES;
            const method = liveClassForm.id ? "PUT" : "POST";
            const payload = {
                ...liveClassForm,
                meetingLink: liveClassForm.provider === "JITSI" ? "" : liveClassForm.meetingLink,
                passcode: liveClassForm.provider === "ZOOM" ? liveClassForm.passcode : "",
            };
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
            const res = await fetch(ENDPOINTS.Faculty.CANCEL_LIVE_CLASS(liveClassId), {
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
                    <button className={styles.secondaryBtn} onClick={openAttendanceModal} style={{ background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1" }}>
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
                                        {(() => {
                                        const joinTarget = resolveLiveClassJoinTarget(liveClass, "TEACHER");
                                        const accessState = getLiveClassAccessState(liveClass);
                                        const joinDisabledLabel = accessState === "NOT_STARTED"
                                            ? "Starts at Scheduled Time"
                                            : accessState === "EXPIRED"
                                                ? "Session Expired"
                                                : accessState === "COMPLETED"
                                                    ? "Class Ended"
                                                    : liveClass.status === "CANCELLED"
                                                        ? "Class Cancelled"
                                                        : "Join Unavailable";
                                            return (
                                                <>
                                        <div className={styles.contentIcon} style={{ background: liveClass.status === "CANCELLED" ? "#fef2f2" : "#f5f3ff", color: liveClass.status === "CANCELLED" ? "#dc2626" : "#7c3aed" }}>
                                            <Video size={20} />
                                        </div>
                                        <div className={styles.contentText}>
                                            <h5>{liveClass.title}</h5>
                                            <p>
                                                {new Date(liveClass.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                                {" | "}{liveClass.status}
                                            </p>
                                            <p>{getLiveClassProviderLabel(liveClass.provider)}</p>
                                            {liveClass.description ? <p>{liveClass.description}</p> : null}
                                        </div>
                                        <div className={styles.liveClassActions}>
                                            {accessState === "AVAILABLE" && joinTarget.href ? (
                                                joinTarget.external ? (
                                                    <a href={joinTarget.href} target="_blank" rel="noreferrer" className={styles.actionBtn}>Join</a>
                                                ) : (
                                                    <Link href={joinTarget.href} className={styles.actionBtn}>Join</Link>
                                                )
                                            ) : (
                                                <span className={styles.inlineBtn}>{joinDisabledLabel}</span>
                                            )}
                                            <button type="button" className={styles.inlineBtn} onClick={() => openEditLiveClass(liveClass)}>
                                                <PencilSimple size={14} /> Edit
                                            </button>
                                            {liveClass.status !== "CANCELLED" ? (
                                                <button type="button" className={styles.inlineDangerBtn} onClick={() => handleCancelLiveClass(liveClass.id)}>
                                                    Cancel
                                                </button>
                                            ) : null}
                                        </div>
                                                </>
                                            );
                                        })()}
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
                                        onClick={() => router.push(`/faculty/tests/${test.id}/results`)}
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
                            <ReactDateTimePicker
                                label="Date and Time"
                                required
                                variant="soft"
                                value={liveClassForm.scheduledAt}
                                onChange={(value) => setLiveClassForm({ ...liveClassForm, scheduledAt: value })}
                            />
                            <div className={styles.formGroup}>
                                <label>Meeting Provider</label>
                                <CustomSelect
                                    value={liveClassForm.provider}
                                    onChange={(value) => setLiveClassForm({ ...liveClassForm, provider: value })}
                                    options={[
                                        { value: "JITSI", label: "Jitsi Meeting" },
                                        { value: "ZOOM", label: "Zoom Meeting" },
                                        { value: "EXTERNAL", label: "External Link" },
                                    ]}
                                />
                            </div>
                            {liveClassForm.provider === "JITSI" ? (
                                <div className={styles.formGroup}>
                                    <label>Auto-created Jitsi Room</label>
                                    <div style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", borderRadius: "14px", padding: "0.9rem 1rem", lineHeight: 1.6 }}>
                                        The Jitsi meeting room will be created automatically inside LMS. Teachers and students will join from the live class page at the scheduled time.
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.formGroup}>
                                    <label>{liveClassForm.provider === "ZOOM" ? "Zoom Join Link" : "Meeting Link"}</label>
                                    <input required value={liveClassForm.meetingLink} onChange={(e) => setLiveClassForm({ ...liveClassForm, meetingLink: e.target.value })} placeholder={liveClassForm.provider === "ZOOM" ? "https://us06web.zoom.us/j/..." : "https://meet.google.com/..."} />
                                </div>
                            )}
                            {liveClassForm.provider === "ZOOM" ? (
                                <div className={styles.formGroup}>
                                    <label>Passcode</label>
                                    <input value={liveClassForm.passcode} onChange={(e) => setLiveClassForm({ ...liveClassForm, passcode: e.target.value })} placeholder="Optional if your Zoom link already includes it" />
                                </div>
                            ) : null}
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
                                <CustomSelect
                                    value={contentForm.type}
                                    onChange={(value) => handleContentTypeChange(value)}
                                    options={[
                                        { value: "VIDEO", label: "Video Lecture URL" },
                                        { value: "ASSIGNMENT", label: "Assignment" },
                                        { value: "RESOURCE", label: "Resource (PDF, PPT)" },
                                    ]}
                                />
                            </div>
                            {contentForm.type !== "VIDEO" ? (
                                <div className={styles.formGroup}>
                                    <label>Upload Mode</label>
                                    <CustomSelect
                                        value={contentForm.uploadMode}
                                        onChange={(value) => setContentForm({ ...contentForm, uploadMode: value, contentUrl: value === "URL" ? contentForm.contentUrl : "", fileData: value === "FILE" ? contentForm.fileData : "", fileName: value === "FILE" ? contentForm.fileName : "" })}
                                        options={[
                                            { value: "FILE", label: "Upload File" },
                                            { value: "URL", label: "Use File URL" },
                                        ]}
                                    />
                                </div>
                            ) : null}
                            {contentForm.type === "VIDEO" || contentForm.uploadMode === "URL" ? (
                                <div className={styles.formGroup}>
                                    <label>{contentForm.type === "VIDEO" ? "Video URL" : "File URL"}</label>
                                    <input required value={contentForm.contentUrl} onChange={e => setContentForm({ ...contentForm, contentUrl: e.target.value })} placeholder="https://..." />
                                </div>
                            ) : (
                                <div className={styles.formGroup}>
                                    <label>Upload File</label>
                                    <input type="file" required onChange={handleContentFileChange} />
                                    {contentForm.fileName ? <small style={{ color: "#64748b", fontWeight: 600 }}>Selected: {contentForm.fileName}</small> : null}
                                </div>
                            )}
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
                    <div className={`${styles.modal} ${styles.testModal}`} style={{ maxWidth: "840px" }}>
                        <div className={styles.modalHeader}>
                            <h3>New MCQ Assessment</h3>
                            <button onClick={closeCreateTestModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateTest} className={styles.form}>
                            <div className={styles.testFormIntro}>
                                <div>
                                    <div className={styles.testFormEyebrow}>Assessment Builder</div>
                                    <div className={styles.testFormLead}>Design a timed MCQ test for this batch.</div>
                                    <p className={styles.testFormNote}>Add clear questions, define one correct answer for each option set, and notify students as soon as you publish.</p>
                                </div>
                            <div className={styles.testHighlightGrid}>
                                <div className={styles.testHighlightCard}>
                                        <span className={styles.testHighlightValue}>
                                            {testInputMode === "BULK" ? bulkPreview.count : testForm.questions.length}
                                        </span>
                                        <span className={styles.testHighlightLabel}>Questions</span>
                                    </div>
                                    <div className={styles.testHighlightCard}>
                                        <span className={styles.testHighlightValue}>{testForm.totalMarks}</span>
                                        <span className={styles.testHighlightLabel}>Marks</span>
                                    </div>
                                    <div className={styles.testHighlightCard}>
                                        <span className={styles.testHighlightValue}>{testForm.durationMinutes}</span>
                                        <span className={styles.testHighlightLabel}>Minutes</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.testMetaGrid}>
                                <div className={styles.formGroup}>
                                    <label>Test Title</label>
                                    <input required value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} placeholder="e.g. Module 1 Practice Test" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Total Marks</label>
                                    <input type="number" min="1" required value={testForm.totalMarks} onChange={e => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value || "0", 10) })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Duration (Minutes)</label>
                                    <input type="number" min="1" required value={testForm.durationMinutes} onChange={e => setTestForm({ ...testForm, durationMinutes: parseInt(e.target.value || "0", 10) })} />
                                </div>
                                <div className={`${styles.formGroup} ${styles.testMetaWide}`}>
                                    <label>Student Instructions</label>
                                    <textarea value={testForm.description} onChange={e => setTestForm({ ...testForm, description: e.target.value })} rows={3} placeholder="Add instructions students should read before starting the test" />
                                </div>
                            </div>

                            <div className={styles.testQuestionsHeader}>
                                <div>
                                    <div className={styles.testQuestionsTitle}>MCQ Questions</div>
                                    <div className={styles.testQuestionsSub}>Each question needs 4 options and exactly 1 correct answer.</div>
                                </div>
                                <div className={styles.testModeSwitch}>
                                    <button
                                        type="button"
                                        className={`${styles.testModeBtn} ${testInputMode === "MANUAL" ? styles.testModeBtnActive : ""}`}
                                        onClick={() => setTestInputMode("MANUAL")}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.testModeBtn} ${testInputMode === "BULK" ? styles.testModeBtnActive : ""}`}
                                        onClick={() => setTestInputMode("BULK")}
                                    >
                                        Bulk Paste/CSV
                                    </button>
                                </div>
                            </div>

                            {testInputMode === "MANUAL" ? (
                                <>
                                    <button type="button" className={styles.secondaryBtn} onClick={addTestQuestion}>
                                        <Plus size={16} weight="bold" /> Add Question
                                    </button>
                                    <div className={styles.testQuestionsList}>
                                        {testForm.questions.map((question: any, questionIndex: number) => (
                                            <div key={question.id} className={styles.testQuestionCard}>
                                                <div className={styles.testQuestionHeader}>
                                                    <div>
                                                        <div className={styles.testQuestionIndex}>Question {questionIndex + 1}</div>
                                                        <div className={styles.testQuestionHint}>Students must answer this before submission.</div>
                                                    </div>
                                                    <button type="button" className={styles.inlineDangerBtn} onClick={() => removeTestQuestion(question.id)} disabled={testForm.questions.length === 1}>
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label>Question Text</label>
                                                    <textarea required value={question.text} onChange={(e) => updateTestQuestion(question.id, e.target.value)} rows={2} placeholder="Type the question" />
                                                </div>

                                                <div className={styles.testOptionGrid}>
                                                    {question.options.map((option: string, optionIndex: number) => (
                                                        <div key={optionIndex} className={styles.testOptionCard}>
                                                            <div className={styles.testOptionTop}>
                                                                <label>Option {String.fromCharCode(65 + optionIndex)}</label>
                                                                <label className={styles.correctOptionToggle}>
                                                                    <input type="radio" name={`correct-${question.id}`} checked={question.correctIndex === optionIndex} onChange={() => setCorrectOption(question.id, optionIndex)} />
                                                                    <span>Correct Answer</span>
                                                                </label>
                                                            </div>
                                                            <input required value={option} onChange={(e) => updateTestOption(question.id, optionIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.bulkQuestionPanel}>
                                    <div className={styles.bulkHelpCard}>
                                        <div className={styles.bulkHelpTitle}>Bulk Input Format</div>
                                        <p>
                                            Paste one question per line using: <strong>Question | Option A | Option B | Option C | Option D | Correct Option</strong>
                                        </p>
                                        <p>Example: <code>What is Java?|Language|Database|Browser|OS|A</code></p>
                                        <p>Or upload CSV with headers: <code>question,option_a,option_b,option_c,option_d,correct_option</code></p>
                                        <p>Maximum 50 questions per test.</p>
                                    </div>
                                    <div className={styles.bulkUploadRow}>
                                        <label className={styles.bulkUploadLabel}>
                                            Upload CSV
                                            <input type="file" accept=".csv,text/csv" onChange={handleBulkCsvUpload} />
                                        </label>
                                        {bulkCsvFileName ? <span className={styles.bulkFileName}>Loaded: {bulkCsvFileName}</span> : null}
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Bulk Questions</label>
                                        <textarea
                                            value={bulkQuestionText}
                                            onChange={(event) => setBulkQuestionText(event.target.value)}
                                            rows={10}
                                            placeholder="Paste MCQs here..."
                                        />
                                        <div className={styles.bulkPreviewRow}>
                                            <span className={styles.bulkPreviewCount}>Detected Questions: {bulkPreview.count}</span>
                                            {bulkPreview.error ? <span className={styles.bulkPreviewError}>{bulkPreview.error}</span> : null}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.testFormActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={closeCreateTestModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>Create Test and Notify Students</button>
                            </div>
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
                                <CustomSelect
                                    value={announcementForm.priority}
                                    onChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}
                                    options={[
                                        { value: "LOW", label: "Low" },
                                        { value: "NORMAL", label: "Normal" },
                                        { value: "HIGH", label: "High" },
                                    ]}
                                />
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
                                        <div style={{ width: "150px" }}>
                                            <CustomSelect
                                                value={attendanceRecords[enrollment.student.id] || "PRESENT"}
                                                onChange={(value) => setAttendanceRecords({ ...attendanceRecords, [enrollment.student.id]: value })}
                                                options={[
                                                    { value: "PRESENT", label: "Present" },
                                                    { value: "ABSENT", label: "Absent" },
                                                    { value: "LATE", label: "Late" },
                                                ]}
                                            />
                                        </div>
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
