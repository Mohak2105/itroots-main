"use client";

import Link from "next/link";
import { use, useEffect, useState, useRef, useMemo, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import LMSShell from "@/components/lms/LMSShell";
import { useLMSAuth } from "@/app/lms/auth-context";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { buildStudentContentViewerHref } from "@/utils/studentContentViewer";
import {
    UploadSimple,
    FolderOpen, ArrowRight, Plus, X, MagnifyingGlass,
    PlayCircle, FilePdf, FilePpt, Books, File, FileText, ImageSquare, CheckSquare, Spinner, Exam, Megaphone, CalendarCheck, Trash, PencilSimple,
} from "@phosphor-icons/react";
import styles from "./content.module.css";

type Batch = { id: string; name: string; courseId?: string; course?: { id: string; title: string } };
type Enrollment = { student: { id: string; name: string; email?: string } };

type Content = {
    id: string;
    batchId?: string;
    title: string;
    type: "VIDEO" | "DOCUMENT" | "RESOURCE" | "ASSIGNMENT";
    description?: string;
    contentUrl?: string;
    fileType?: string;
    createdAt: string;
    batch?: { name: string };
};

const TABS = ["ALL", "VIDEO", "DOCUMENT", "RESOURCE", "ASSIGNMENT"] as const;
type Tab = typeof TABS[number];
type TestInputMode = "MANUAL" | "BULK";
type StudyMaterialType = "IMAGE" | "PDF" | "PPT" | "DOC";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    VIDEO:      { label: "Video",      icon: PlayCircle,  color: "#0881ec", bg: "#eff6ff" },
    DOCUMENT:   { label: "Document",   icon: FilePdf,     color: "#dc2626", bg: "#fef2f2" },
    RESOURCE:   { label: "Resource",   icon: File,        color: "#7c3aed", bg: "#faf5ff" },
    ASSIGNMENT: { label: "Assignment", icon: CheckSquare, color: "#d97706", bg: "#fff7ed" },
};

const STUDY_MATERIAL_META: Record<StudyMaterialType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    IMAGE: { label: "Image", icon: ImageSquare, color: "#16a34a", bg: "#f0fdf4" },
    PDF: { label: "PDF", icon: FilePdf, color: "#dc2626", bg: "#fef2f2" },
    PPT: { label: "PPT", icon: FilePpt, color: "#f59e0b", bg: "#fff7ed" },
    DOC: { label: "DOC", icon: FileText, color: "#2563eb", bg: "#eff6ff" },
};

const STUDY_MATERIAL_OPTIONS: Array<{ value: StudyMaterialType; label: string }> = [
    { value: "IMAGE", label: "Image" },
    { value: "PDF", label: "PDF" },
    { value: "PPT", label: "PPT" },
    { value: "DOC", label: "DOC" },
];

const STUDY_MATERIAL_ACCEPT: Record<StudyMaterialType, string> = {
    IMAGE: ".jpg,.jpeg,.png,.webp,.gif,.bmp",
    PDF: ".pdf",
    PPT: ".ppt,.pptx",
    DOC: ".doc,.docx",
};

const STUDY_MATERIAL_HELPER_TEXT: Record<StudyMaterialType, string> = {
    IMAGE: "Upload JPG, JPEG, PNG, WEBP, GIF, or BMP image files only.",
    PDF: "Upload PDF documents only.",
    PPT: "Upload PPT or PPTX slide decks only.",
    DOC: "Upload DOC or DOCX documents only.",
};

const STUDY_MATERIAL_EXTENSION_MAP: Record<StudyMaterialType, string[]> = {
    IMAGE: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
    PDF: [".pdf"],
    PPT: [".ppt", ".pptx"],
    DOC: [".doc", ".docx"],
};

const STUDY_MATERIAL_UPLOAD_ERROR = "Please select an image, PDF, PPT, or DOC file.";

const CORRECT_INDEX_BY_LABEL: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const MAX_BULK_QUESTIONS = 50;

const createEmptyTestQuestion = () => ({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
});

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

            questions.push({ id: `q-${row}`, text, options, correctIndex });
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

function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function resolveContentUrl(rawUrl?: string) {
    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("data:")) {
        return rawUrl;
    }
    return `${API_ORIGIN}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

function getYouTubeVideoId(rawUrl: string) {
    try {
        const parsedUrl = new URL(rawUrl);
        const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

        if (host === "youtu.be") {
            return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            if (parsedUrl.pathname === "/watch") {
                return parsedUrl.searchParams.get("v") || "";
            }
            if (parsedUrl.pathname.startsWith("/embed/") || parsedUrl.pathname.startsWith("/shorts/")) {
                return parsedUrl.pathname.split("/")[2] || "";
            }
        }
    } catch {
        return "";
    }

    return "";
}

function getYouTubeEmbedUrl(rawUrl: string) {
    const videoId = getYouTubeVideoId(rawUrl);
    if (!videoId) return null;

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    return embedUrl.toString();
}

function isDirectVideoUrl(rawUrl: string) {
    const normalizedUrl = rawUrl.split("?")[0].toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((extension) => normalizedUrl.endsWith(extension));
}

function detectStudyMaterialType(source?: string | null): StudyMaterialType | null {
    if (!source) return null;

    const sanitizedSource = String(source).split("?")[0].split("#")[0].toLowerCase();
    const matchedEntry = Object.entries(STUDY_MATERIAL_EXTENSION_MAP).find(([, extensions]) =>
        extensions.some((extension) => sanitizedSource.endsWith(extension)),
    );

    return (matchedEntry?.[0] as StudyMaterialType | undefined) || null;
}

interface TeacherContentPageProps {
    searchParams: Promise<{
        type?: string | string[];
        open?: string | string[];
        batchId?: string | string[];
    }>;
}

export default function TeacherContent({ searchParams }: TeacherContentPageProps) {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const resolvedSearchParams = use(searchParams);
    const requestedTypeValue = resolvedSearchParams?.type;
    const requestedOpenValue = resolvedSearchParams?.open;
    const requestedBatchValue = resolvedSearchParams?.batchId;
    const requestedTypeParam = (Array.isArray(requestedTypeValue) ? requestedTypeValue[0] || "" : requestedTypeValue || "").toUpperCase();
    const requestedOpenParam = (Array.isArray(requestedOpenValue) ? requestedOpenValue[0] || "" : requestedOpenValue || "").toLowerCase();
    const requestedBatchId = Array.isArray(requestedBatchValue) ? requestedBatchValue[0] || "" : requestedBatchValue || "";

    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>("");

    const [contents, setContents] = useState<Content[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [tab, setTab] = useState<Tab>("ALL");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [announcementError, setAnnouncementError] = useState<string | null>(null);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);
    const [savingTest, setSavingTest] = useState(false);
    const [savingAnnouncement, setSavingAnnouncement] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [form, setForm] = useState({
        title: "",
        type: "VIDEO" as Content["type"],
        description: "",
        contentUrl: "",
        batchId: "",
        courseId: "",
        materialFormat: "PDF" as StudyMaterialType,
    });
    const [testInputMode, setTestInputMode] = useState<TestInputMode>("MANUAL");
    const [bulkQuestionText, setBulkQuestionText] = useState("");
    const [bulkCsvFileName, setBulkCsvFileName] = useState("");
    const [testForm, setTestForm] = useState({
        title: "",
        description: "",
        totalMarks: 100,
        durationMinutes: 60,
        questions: [createEmptyTestQuestion()],
    });
    const [announcementForm, setAnnouncementForm] = useState({
        title: "",
        content: "",
        priority: "NORMAL",
    });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
    const [file, setFile] = useState<File | null>(null);
    const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const autoOpenedActionRef = useRef("");
    const activeContentMode = useMemo<"VIDEO" | "DOCUMENT" | "RESOURCE" | "ASSIGNMENT" | "TEST">(() => {
        if (requestedOpenParam === "test") {
            return "TEST";
        }

        if (requestedTypeParam && TABS.includes(requestedTypeParam as Tab) && requestedTypeParam !== "ALL") {
            return requestedTypeParam as "VIDEO" | "DOCUMENT" | "RESOURCE" | "ASSIGNMENT";
        }

        return "VIDEO";
    }, [requestedOpenParam, requestedTypeParam]);
    const isVideoOnlyView = activeContentMode === "VIDEO";
    const isStudyMaterialView = activeContentMode === "RESOURCE";
    const shellPageTitle = activeContentMode === "RESOURCE"
        ? "Study Material"
        : activeContentMode === "TEST"
            ? "Tests"
            : "Video Lectures";
    const bannerTitle = isVideoOnlyView ? "Video Lectures" : isStudyMaterialView ? "Study Material" : "Video Lectures & Content";
    const bannerSubtitle = isVideoOnlyView
        ? "Upload and manage batch-wise video lectures for your students."
        : isStudyMaterialView
            ? "Upload and manage image, PDF, PPT, and DOC study materials for your batches."
            : "Upload videos, documents, and resources for your batches.";
    const bannerActionLabel = isVideoOnlyView ? "Upload Video" : isStudyMaterialView ? "Upload Material" : "Upload Content";
    const BannerIcon = isVideoOnlyView ? PlayCircle : isStudyMaterialView ? Books : FolderOpen;

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.Faculty.MY_BATCHES, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const list: Batch[] = Array.isArray(data) ? data : (data.batches ?? []);
                setBatches(list);
                if (requestedBatchId && list.some((batch) => batch.id === requestedBatchId)) {
                    setSelectedBatch(requestedBatchId);
                } else if (list.length > 0) {
                    setSelectedBatch(list[0].id);
                }
            })
            .catch(console.error);
    }, [requestedBatchId, token]);

    useEffect(() => {
        if (activeContentMode === "TEST") {
            return;
        }

        setTab(activeContentMode);
    }, [activeContentMode]);

    useEffect(() => {
        if (!requestedOpenParam) {
            autoOpenedActionRef.current = "";
            return;
        }

        if (!selectedBatch || autoOpenedActionRef.current === requestedOpenParam) {
            return;
        }

        if (requestedOpenParam === "test") {
            openTestModalPanel();
            autoOpenedActionRef.current = requestedOpenParam;
        }
    }, [requestedOpenParam, selectedBatch]);

    const courses = useMemo(() => {
        const seen = new Map<string, { id: string; title: string }>();
        batches.forEach(b => {
            if (b.course?.id && !seen.has(b.course.id)) {
                seen.set(b.course.id, b.course);
            }
        });
        return Array.from(seen.values());
    }, [batches]);

    const filteredBatches = useMemo(
        () => batches.filter(b => !form.courseId || b.courseId === form.courseId),
        [batches, form.courseId]
    );

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

    const syncBatchData = (payload: any) => {
        const batchPayload = payload?.data && typeof payload.data === "object" ? payload.data : payload;
        const nextContents = Array.isArray(batchPayload?.contents)
            ? batchPayload.contents
            : Array.isArray(payload?.contents)
                ? payload.contents
                : [];
        const nextEnrollments = Array.isArray(batchPayload?.enrollments)
            ? batchPayload.enrollments
            : Array.isArray(payload?.enrollments)
                ? payload.enrollments
                : [];

        setContents(nextContents);
        setEnrollments(nextEnrollments);
        setAttendanceRecords((current) => {
            const nextRecords: Record<string, string> = {};
            nextEnrollments.forEach((enrollment: Enrollment) => {
                const studentId = enrollment.student?.id;
                if (studentId) {
                    nextRecords[studentId] = current[studentId] || "PRESENT";
                }
            });
            return nextRecords;
        });
    };

    const refreshSelectedBatchData = async () => {
        if (!token || !selectedBatch) return;
        setLoadingContent(true);
        try {
            const response = await fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${selectedBatch}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            syncBatchData(data);
        } catch (error) {
            console.error(error);
            setContents([]);
            setEnrollments([]);
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        if (!token || !selectedBatch) return;
        void refreshSelectedBatchData();
    }, [token, selectedBatch]);

    const filtered = contents.filter(c => {
        const activeTab = isVideoOnlyView ? "VIDEO" : tab;
        const matchTab = activeTab === "ALL" || c.type === activeTab;
        const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    function clearSelectedFile() {
        setFile(null);
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    }

    function handleStudyMaterialFormatChange(value: string) {
        const nextFormat = value as StudyMaterialType;
        setForm((current) => ({ ...current, materialFormat: nextFormat }));
        setUploadError(null);

        if (!file) {
            return;
        }

        const detectedType = detectStudyMaterialType(file.name);
        if (detectedType && detectedType !== nextFormat) {
            clearSelectedFile();
        }
    }

    function handleSelectedFileChange(event: ChangeEvent<HTMLInputElement>) {
        const nextFile = event.target.files?.[0] ?? null;

        if (!nextFile) {
            setFile(null);
            return;
        }

        if (isStudyMaterialView) {
            const detectedType = detectStudyMaterialType(nextFile.name);

            if (!detectedType) {
                setUploadError(STUDY_MATERIAL_UPLOAD_ERROR);
                clearSelectedFile();
                return;
            }

            if (detectedType !== form.materialFormat) {
                setUploadError(`Selected material type does not match the uploaded file. Detected: ${STUDY_MATERIAL_META[detectedType].label}.`);
                clearSelectedFile();
                return;
            }
        }

        setUploadError(null);
        setFile(nextFile);
    }

    function openModal() {
        const defaultBatch = batches.find(b => b.id === selectedBatch);
        const defaultType = activeContentMode === "DOCUMENT"
            || isStudyMaterialView
            || activeContentMode === "ASSIGNMENT"
            ? activeContentMode
            : "VIDEO";
        setEditingContentId(null);
        setForm({
            title: "",
            type: defaultType,
            description: "",
            contentUrl: "",
            batchId: selectedBatch,
            courseId: defaultBatch?.courseId || defaultBatch?.course?.id || "",
            materialFormat: "PDF",
        });
        clearSelectedFile();
        setUploadError(null);
        setShowModal(true);
    }

    function openEditModal(content: Content) {
        const batchMatch = batches.find((batch) => batch.id === content.batchId) || batches.find((batch) => batch.id === selectedBatch);
        const normalizedFileType = (content.fileType || "").toUpperCase() as StudyMaterialType;
        setEditingContentId(content.id);
        setForm({
            title: content.title || "",
            type: content.type,
            description: content.description || "",
            contentUrl: content.contentUrl || "",
            batchId: content.batchId || selectedBatch,
            courseId: batchMatch?.courseId || batchMatch?.course?.id || "",
            materialFormat: normalizedFileType in STUDY_MATERIAL_META ? normalizedFileType : "PDF",
        });
        clearSelectedFile();
        setUploadError(null);
        setShowModal(true);
    }

    function closeContentModal() {
        setShowModal(false);
        setEditingContentId(null);
        setUploadError(null);
        clearSelectedFile();
    }

    function resetTestModal() {
        setShowTestModal(false);
        setTestError(null);
        setSavingTest(false);
        setTestInputMode("MANUAL");
        setBulkQuestionText("");
        setBulkCsvFileName("");
        setTestForm({
            title: "",
            description: "",
            totalMarks: 100,
            durationMinutes: 60,
            questions: [createEmptyTestQuestion()],
        });
    }

    function addTestQuestion() {
        setTestForm((prev) => ({
            ...prev,
            questions: [...prev.questions, createEmptyTestQuestion()],
        }));
    }

    function removeTestQuestion(questionId: string) {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.length > 1
                ? prev.questions.filter((question) => question.id !== questionId)
                : prev.questions,
        }));
    }

    function updateTestQuestion(questionId: string, value: string) {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => (
                question.id === questionId ? { ...question, text: value } : question
            )),
        }));
    }

    function updateTestOption(questionId: string, optionIndex: number, value: string) {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => {
                if (question.id !== questionId) return question;
                const nextOptions = [...question.options];
                nextOptions[optionIndex] = value;
                return { ...question, options: nextOptions };
            }),
        }));
    }

    function setCorrectOption(questionId: string, optionIndex: number) {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => (
                question.id === questionId ? { ...question, correctIndex: optionIndex } : question
            )),
        }));
    }

    function openTestModalPanel() {
        setTestError(null);
        setShowTestModal(true);
    }

    function openAnnouncementModalPanel() {
        setAnnouncementError(null);
        setAnnouncementForm({
            title: "",
            content: "",
            priority: "NORMAL",
        });
        setShowAnnouncementModal(true);
    }

    async function handleBulkCsvUpload(event: ChangeEvent<HTMLInputElement>) {
        const uploadedFile = event.target.files?.[0];
        if (!uploadedFile) {
            setBulkCsvFileName("");
            return;
        }

        const text = await uploadedFile.text();
        setBulkQuestionText(text);
        setBulkCsvFileName(uploadedFile.name);
    }

    async function handleCreateTest(event: FormEvent) {
        event.preventDefault();
        if (!token || !selectedBatch) return;

        setSavingTest(true);
        setTestError(null);
        try {
            const questionsPayload = testInputMode === "BULK"
                ? parseBulkMcqQuestions(bulkQuestionText)
                : testForm.questions;

            const response = await fetch(ENDPOINTS.Faculty.CREATE_TEST, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...testForm,
                    batchId: selectedBatch,
                    questions: questionsPayload,
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const message = Array.isArray(data?.errors) && data.errors.length
                    ? data.errors.slice(0, 3).join("\n")
                    : data?.message || "Unable to create test";
                throw new Error(message);
            }

            resetTestModal();
        } catch (error) {
            console.error(error);
            setTestError(error instanceof Error ? error.message : "Unable to create test");
        } finally {
            setSavingTest(false);
        }
    }

    async function handleCreateAnnouncement(event: FormEvent) {
        event.preventDefault();
        if (!token || !selectedBatch) return;

        setSavingAnnouncement(true);
        setAnnouncementError(null);
        try {
            const response = await fetch(`${ENDPOINTS.Faculty.BASE}/announcements`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...announcementForm, batchId: selectedBatch }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to post announcement");
            }

            setAnnouncementForm({ title: "", content: "", priority: "NORMAL" });
            setShowAnnouncementModal(false);
        } catch (error) {
            console.error(error);
            setAnnouncementError(error instanceof Error ? error.message : "Unable to post announcement");
        } finally {
            setSavingAnnouncement(false);
        }
    }

    async function loadAttendanceForDate(selectedDate: string) {
        if (!token || !selectedBatch) return;

        try {
            const response = await fetch(`${ENDPOINTS.Faculty.BASE}/attendance/${selectedBatch}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => null);
            const existingRecords = Array.isArray(data?.data) ? data.data : [];
            const nextRecords: Record<string, string> = {};

            enrollments.forEach((enrollment) => {
                if (enrollment.student?.id) {
                    nextRecords[enrollment.student.id] = "PRESENT";
                }
            });

            existingRecords.forEach((record: any) => {
                if (record.studentId) {
                    nextRecords[record.studentId] = record.status;
                }
            });

            setAttendanceRecords(nextRecords);
        } catch (error) {
            console.error(error);
        }
    }

    async function openAttendanceModal() {
        setAttendanceError(null);
        setShowAttendanceModal(true);
        await loadAttendanceForDate(attendanceDate);
    }

    async function handleMarkAttendance(event: FormEvent) {
        event.preventDefault();
        if (!token || !selectedBatch) return;

        setSavingAttendance(true);
        setAttendanceError(null);
        try {
            const records = Object.keys(attendanceRecords).map((studentId) => ({
                studentId,
                status: attendanceRecords[studentId],
            }));

            const response = await fetch(`${ENDPOINTS.Faculty.BASE}/attendance`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    batchId: selectedBatch,
                    date: attendanceDate,
                    records,
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to save attendance");
            }

            setShowAttendanceModal(false);
        } catch (error) {
            console.error(error);
            setAttendanceError(error instanceof Error ? error.message : "Unable to save attendance");
        } finally {
            setSavingAttendance(false);
        }
    }

    async function handleUpload(e: FormEvent) {
        e.preventDefault();
        if (!token) return;
        setUploading(true);
        setUploadError(null);

        try {
            const body: Record<string, any> = {
                batchId: form.batchId || selectedBatch,
                title: form.title,
                type: isStudyMaterialView ? "RESOURCE" : form.type,
                description: form.description,
            };

            if (form.type === "VIDEO") {
                body.contentUrl = form.contentUrl;
            } else if (file) {
                if (isStudyMaterialView) {
                    const detectedType = detectStudyMaterialType(file.name);
                    if (!detectedType) {
                        throw new Error(STUDY_MATERIAL_UPLOAD_ERROR);
                    }
                    if (detectedType !== form.materialFormat) {
                        throw new Error(`Selected material type does not match the uploaded file. Detected: ${STUDY_MATERIAL_META[detectedType].label}.`);
                    }
                }

                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(",")[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                body.fileData = base64;
                body.fileName = file.name;
                if (isStudyMaterialView) {
                    body.materialFormat = form.materialFormat;
                }
            } else if (isStudyMaterialView) {
                throw new Error(STUDY_MATERIAL_UPLOAD_ERROR);
            }

            const isEditing = Boolean(editingContentId);
            const endpoint = isEditing && editingContentId
                ? ENDPOINTS.Faculty.UPDATE_CONTENT(editingContentId)
                : ENDPOINTS.Faculty.ADD_CONTENT;

            const res = await fetch(endpoint, {
                method: isEditing ? "PATCH" : "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Upload failed");

            closeContentModal();
            await refreshSelectedBatchData();
        } catch (err: any) {
            setUploadError(err.message || "Something went wrong");
        } finally {
            setUploading(false);
            setLoadingContent(false);
        }
    }

    async function handleDeleteContent(contentId: string, title: string) {
        if (!token) return;
        const confirmed = window.confirm(`Delete "${title}"?`);
        if (!confirmed) return;

        setDeletingContentId(contentId);
        try {
            const response = await fetch(ENDPOINTS.Faculty.DELETE_CONTENT(contentId), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to delete content");
            }
            await refreshSelectedBatchData();
        } catch (error) {
            console.error(error);
            window.alert(error instanceof Error ? error.message : "Unable to delete content");
        } finally {
            setDeletingContentId(null);
        }
    }

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle={shellPageTitle}>
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div className={styles.bannerInner}>
                        <div className={styles.bannerText}>
                            <h1 className={styles.bannerTitle}>{bannerTitle}</h1>
                            <p className={styles.bannerSubtitle}>{bannerSubtitle}</p>
                        </div>
                        <button className={styles.bannerAction} onClick={openModal}>
                            <Plus size={18} weight="bold" /> {bannerActionLabel}
                        </button>
                    </div>
                    <div className={styles.bannerIcon} aria-hidden="true">
                        <BannerIcon size={74} weight="duotone" />
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.batchSelect}>
                        <label className={styles.batchLabel}>Batch</label>
                        <div className={styles.customSelectWrap}>
                            <CustomSelect
                                value={selectedBatch}
                                onChange={(value) => setSelectedBatch(value)}
                                placeholder="Select batch"
                                disabled={batches.length === 0}
                                options={
                                    batches.length === 0
                                        ? [{ value: "", label: "No batches" }]
                                        : batches.map((batch) => ({
                                            value: batch.id,
                                            label: batch.name,
                                        }))
                                }
                            />
                        </div>
                    </div>

                    
                </div>

                <div className={styles.contentSection}>
                    {loadingContent ? (
                        <div className={styles.skeletonWrap}>
                            {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.empty}>
                            <FolderOpen size={48} color="#cbd5e1" weight="duotone" />
                            <p>
                                {search
                                    ? "No results match your search."
                                    : isVideoOnlyView
                                        ? "No videos uploaded yet for this batch."
                                        : isStudyMaterialView
                                            ? "No study materials uploaded yet for this batch."
                                            : "No content uploaded yet for this batch."}
                            </p>
                            {!search && (
                                <button className={styles.emptyUploadBtn} onClick={openModal}>
                                    <Plus size={15} weight="bold" /> {isVideoOnlyView ? "Upload  Video" : isStudyMaterialView ? "Upload  Material" : "Upload  Content"}
                                </button>
                            )}
                        </div>
                    ) : isVideoOnlyView ? (
                        <div className={styles.videoLectureGrid}>
                            {filtered.map((item) => {
                                const resolvedUrl = resolveContentUrl(item.contentUrl);
                                const embedUrl = getYouTubeEmbedUrl(resolvedUrl);
                                const previewIsDirectVideo = isDirectVideoUrl(resolvedUrl);

                                return (
                                    <article key={item.id} className={styles.videoLectureCard}>
                                        <div className={styles.videoLecturePreview}>
                                            {embedUrl ? (
                                                <iframe
                                                    title={item.title}
                                                    src={embedUrl}
                                                    className={styles.videoLectureFrame}
                                                    loading="lazy"
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                    allowFullScreen
                                                />
                                            ) : previewIsDirectVideo ? (
                                                <video
                                                    className={styles.videoLectureFrame}
                                                    controls
                                                    preload="metadata"
                                                    src={resolvedUrl}
                                                />
                                            ) : (
                                                <div className={styles.videoLectureFallback}>
                                                    <PlayCircle size={34} weight="duotone" />
                                                    <span>Preview unavailable</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.videoLectureBody}>
                                            <div className={styles.videoLectureTitle}>{item.title}</div>
                                            
                                            <div className={styles.videoLectureMeta}>
                                               
                                                <span className={styles.contentDate}>{fmt(item.createdAt)}</span>
                                            </div>
                                            <div className={styles.videoLectureActions}>
                                                
                                                <button
                                                    type="button"
                                                    className={styles.editBtn}
                                                    onClick={() => openEditModal(item)}
                                                >
                                                    <PencilSimple size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteContent(item.id, item.title)}
                                                    disabled={deletingContentId === item.id}
                                                >
                                                    {deletingContentId === item.id ? (
                                                        <Spinner size={14} className={styles.spinner} />
                                                    ) : (
                                                        <Trash size={14} />
                                                    )}
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : isStudyMaterialView ? (
                        <div className={styles.studyMaterialGrid}>
                            {filtered.map((item) => {
                                const normalizedFileType = item.fileType?.toUpperCase() as StudyMaterialType | undefined;
                                const materialType = normalizedFileType && normalizedFileType in STUDY_MATERIAL_META
                                    ? normalizedFileType
                                    : null;
                                const meta = materialType ? STUDY_MATERIAL_META[materialType] : TYPE_META.RESOURCE;
                                const Icon = meta.icon;
                                const resolvedUrl = resolveContentUrl(item.contentUrl);
                                const materialViewerHref = resolvedUrl
                                    ? buildStudentContentViewerHref(resolvedUrl, item.title)
                                    : "";
                                const previewPdfUrl = materialType === "PDF" && resolvedUrl
                                    ? `${resolvedUrl}${resolvedUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`
                                    : "";

                                return (
                                    <article key={item.id} className={styles.studyMaterialCard}>
                                        {resolvedUrl ? (
                                            <Link
                                                href={materialViewerHref}
                                                className={styles.studyMaterialPreviewLink}
                                                aria-label={`View ${item.title}`}
                                            >
                                                <div
                                                    className={`${styles.studyMaterialPreview} ${styles.studyMaterialPreviewClickable} ${materialType === "PDF" ? styles.studyMaterialPdfPreview : ""}`}
                                                    style={{ background: materialType === "PDF" || materialType === "IMAGE" ? "#ffffff" : meta.bg }}
                                                >
                                                    {materialType === "PDF" ? (
                                                        <iframe
                                                            title={item.title}
                                                            src={previewPdfUrl}
                                                            className={styles.studyMaterialFrame}
                                                        />
                                                    ) : materialType === "IMAGE" ? (
                                                        <img
                                                            src={resolvedUrl}
                                                            alt={item.title}
                                                            className={styles.studyMaterialImage}
                                                        />
                                                    ) : (
                                                        <div className={styles.studyMaterialFallback} style={{ color: meta.color }}>
                                                            <Icon size={42} weight="duotone" />
                                                            <span>{meta.label} Preview</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        ) : (
                                            <div
                                                className={`${styles.studyMaterialPreview} ${materialType === "PDF" ? styles.studyMaterialPdfPreview : ""}`}
                                                style={{ background: materialType === "PDF" || materialType === "IMAGE" ? "#ffffff" : meta.bg }}
                                            >
                                                <div className={styles.studyMaterialFallback} style={{ color: meta.color }}>
                                                    <Icon size={42} weight="duotone" />
                                                    <span>{meta.label} Preview</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.studyMaterialBody}>
                                            <div className={styles.studyMaterialTitle}>{item.title}</div>
                                            {item.description ? (
                                                <div className={styles.studyMaterialDesc}>{item.description}</div>
                                            ) : null}
                                            <div className={styles.studyMaterialMeta}>
                                                <span className={styles.contentType} style={{ background: meta.bg, color: meta.color }}>
                                                    {meta.label}
                                                </span>
                                                <span className={styles.contentDate}>{fmt(item.createdAt)}</span>
                                            </div>
                                            <div className={styles.studyMaterialActions}>
                                                <button
                                                    type="button"
                                                    className={styles.editBtn}
                                                    onClick={() => openEditModal(item)}
                                                >
                                                    <PencilSimple size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteContent(item.id, item.title)}
                                                    disabled={deletingContentId === item.id}
                                                >
                                                    {deletingContentId === item.id ? (
                                                        <Spinner size={14} className={styles.spinner} />
                                                    ) : (
                                                        <Trash size={14} />
                                                    )}
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.contentList}>
                            {filtered.map(item => {
                                const normalizedFileType = item.fileType?.toUpperCase() as StudyMaterialType | undefined;
                                const resourceMeta = item.type === "RESOURCE" && normalizedFileType && normalizedFileType in STUDY_MATERIAL_META
                                    ? STUDY_MATERIAL_META[normalizedFileType]
                                    : null;
                                const meta = resourceMeta ?? TYPE_META[item.type] ?? TYPE_META.RESOURCE;
                                const Icon = meta.icon;
                                return (
                                    <div key={item.id} className={styles.contentCard}>
                                        <div className={styles.contentIcon} style={{ background: meta.bg, color: meta.color }}>
                                            <Icon size={22} weight="duotone" />
                                        </div>
                                        <div className={styles.contentInfo}>
                                            <div className={styles.contentTitle}>{item.title}</div>
                                            {item.description && (
                                                <div className={styles.contentDesc}>{item.description}</div>
                                            )}
                                            <div className={styles.contentMeta}>
                                                <span className={styles.contentType} style={{ background: meta.bg, color: meta.color }}>
                                                    {meta.label}
                                                </span>
                                                <span className={styles.contentDate}>{fmt(item.createdAt)}</span>
                                            </div>
                                        </div>
                                        {item.contentUrl && (
                                            <a href={item.contentUrl} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                                                {item.type === "VIDEO" ? "Watch" : "View"} <ArrowRight size={13} />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className={styles.overlay} onClick={closeContentModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingContentId
                                    ? isVideoOnlyView
                                        ? "Edit Video"
                                        : isStudyMaterialView
                                            ? "Edit Study Material"
                                            : "Edit Content"
                                    : isVideoOnlyView
                                        ? "Upload Video"
                                        : isStudyMaterialView
                                            ? "Upload Study Material"
                                            : "Upload Content"}
                            </span>
                            <button className={styles.closeBtn} onClick={closeContentModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleUpload}>
                            {uploadError && (
                                <div className={styles.modalError}>{uploadError}</div>
                            )}

                            {isVideoOnlyView ? (
                                <div>
                                    <label className={styles.fieldLabel}>Select Batch </label>
                                    <div className={styles.customSelectWrap}>
                                        <CustomSelect
                                            value={form.batchId}
                                            onChange={(value) => setForm(f => ({ ...f, batchId: value }))}
                                            placeholder="Select batch"
                                            required
                                            options={[
                                                { value: "", label: "Select batch" },
                                                ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
                                            ]}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                    <div>
                                        <label className={styles.fieldLabel}>Select Course</label>
                                        <div className={styles.customSelectWrap}>
                                            <CustomSelect
                                                value={form.courseId}
                                                onChange={(value) => setForm(f => ({ ...f, courseId: value, batchId: "" }))}
                                                placeholder="All Courses"
                                                options={[
                                                    { value: "", label: "All Courses" },
                                                    ...courses.map((course) => ({ value: course.id, label: course.title })),
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={styles.fieldLabel}>Select Batch</label>
                                        <div className={styles.customSelectWrap}>
                                            <CustomSelect
                                                value={form.batchId}
                                                onChange={(value) => setForm(f => ({ ...f, batchId: value }))}
                                                placeholder="Select batch"
                                                required
                                                options={[
                                                    { value: "", label: "Select batch" },
                                                    ...filteredBatches.map((batch) => ({ value: batch.id, label: batch.name })),
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <label className={styles.fieldLabel}>Title </label>
                            <input
                                className={styles.input}
                                placeholder={isVideoOnlyView ? "e.g. Java OOPs Introduction" : "e.g. Introduction to React Hooks"}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                required
                            />

                            {!isVideoOnlyView && !isStudyMaterialView && (
                                <>
                                    <label className={styles.fieldLabel}>Type</label>
                                    <div className={styles.typeGrid}>
                                        {(["VIDEO", "DOCUMENT", "RESOURCE", "ASSIGNMENT"] as const).map(t => {
                                            const m = TYPE_META[t];
                                            const Icon = m.icon;
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ""}`}
                                                    style={form.type === t ? { borderColor: m.color, background: m.bg, color: m.color } : {}}
                                                    onClick={() => { setForm(f => ({ ...f, type: t })); setFile(null); }}
                                                >
                                                    <Icon size={18} weight="duotone" />
                                                    {m.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {isStudyMaterialView && (
                                <div>
                                    <label className={styles.fieldLabel}>Material Type</label>
                                    <div className={styles.customSelectWrap}>
                                        <CustomSelect
                                            value={form.materialFormat}
                                            onChange={handleStudyMaterialFormatChange}
                                            options={STUDY_MATERIAL_OPTIONS}
                                        />
                                    </div>
                                    <p className={styles.fieldHint}>{STUDY_MATERIAL_HELPER_TEXT[form.materialFormat]}</p>
                                </div>
                            )}

                            <label className={styles.fieldLabel}>Description</label>
                            <textarea
                                className={styles.textarea}
                                placeholder={isVideoOnlyView ? "Brief summary of the video lecture..." : isStudyMaterialView ? "Brief description of this study material..." : "Brief description of this content..."}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                            />

                            {form.type === "VIDEO" ? (
                                <>
                                    <label className={styles.fieldLabel}>Video URL </label>
                                    <input
                                        className={styles.input}
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={form.contentUrl}
                                        onChange={e => setForm(f => ({ ...f, contentUrl: e.target.value }))}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <label className={styles.fieldLabel}>File</label>
                                    <div
                                        className={styles.dropZone}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {file ? (
                                            <span className={styles.fileName}>{file.name}</span>
                                        ) : (
                                            <>
                                                <UploadSimple size={24} color="#94a3b8" />
                                                <span>Click to select file</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        style={{ display: "none" }}
                                        accept={isStudyMaterialView ? STUDY_MATERIAL_ACCEPT[form.materialFormat] : form.type === "DOCUMENT" ? ".pdf,.doc,.docx,.ppt,.pptx" : "*"}
                                        onChange={handleSelectedFileChange}
                                    />
                                    {isStudyMaterialView && (
                                        <p className={styles.fieldHint}>{STUDY_MATERIAL_HELPER_TEXT[form.materialFormat]}</p>
                                    )}
                                </>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeContentModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                                    {uploading ? <Spinner size={16} className={styles.spinner} /> : <UploadSimple size={16} />}
                                    {uploading ? (editingContentId ? "Saving..." : "Uploading...") : (editingContentId ? "Save Changes" : "Upload")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTestModal && (
                <div className={styles.overlay} onClick={resetTestModal}>
                    <div className={`${styles.modal} ${styles.testModal}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>New MCQ Assessment</span>
                            <button className={styles.closeBtn} onClick={resetTestModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleCreateTest}>
                            {testError ? <div className={styles.modalError}>{testError}</div> : null}

                            <div className={styles.testIntroCard}>
                                <div>
                                    <div className={styles.testEyebrow}>Assessment Builder</div>
                                    <div className={styles.testLead}>Design a timed MCQ test for this batch.</div>
                                    <p className={styles.testNote}>Add clear questions, define one correct answer for each option set, and publish the test for students.</p>
                                </div>
                                <div className={styles.testMetricGrid}>
                                    <div className={styles.testMetricCard}>
                                        <span className={styles.testMetricValue}>{testInputMode === "BULK" ? bulkPreview.count : testForm.questions.length}</span>
                                        <span className={styles.testMetricLabel}>Questions</span>
                                    </div>
                                    <div className={styles.testMetricCard}>
                                        <span className={styles.testMetricValue}>{testForm.totalMarks}</span>
                                        <span className={styles.testMetricLabel}>Marks</span>
                                    </div>
                                    <div className={styles.testMetricCard}>
                                        <span className={styles.testMetricValue}>{testForm.durationMinutes}</span>
                                        <span className={styles.testMetricLabel}>Minutes</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.testMetaGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Test Title</label>
                                    <input
                                        className={styles.input}
                                        required
                                        value={testForm.title}
                                        onChange={e => setTestForm((prev) => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Module 1 Practice Test"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Total Marks</label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        min="1"
                                        required
                                        value={testForm.totalMarks}
                                        onChange={e => setTestForm((prev) => ({ ...prev, totalMarks: parseInt(e.target.value || "0", 10) }))}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Duration (Minutes)</label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        min="1"
                                        required
                                        value={testForm.durationMinutes}
                                        onChange={e => setTestForm((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value || "0", 10) }))}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.fieldLabel}>Student Instructions</label>
                                <textarea
                                    className={styles.textarea}
                                    value={testForm.description}
                                    onChange={e => setTestForm((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    placeholder="Add instructions students should read before starting the test"
                                />
                            </div>

                            <div className={styles.testHeaderRow}>
                                <div>
                                    <div className={styles.testSectionTitle}>MCQ Questions</div>
                                    <div className={styles.testSectionSub}>Each question needs 4 options and exactly 1 correct answer.</div>
                                </div>
                                <div className={styles.modeSwitch}>
                                    <button
                                        type="button"
                                        className={`${styles.modeBtn} ${testInputMode === "MANUAL" ? styles.modeBtnActive : ""}`}
                                        onClick={() => setTestInputMode("MANUAL")}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.modeBtn} ${testInputMode === "BULK" ? styles.modeBtnActive : ""}`}
                                        onClick={() => setTestInputMode("BULK")}
                                    >
                                        Bulk Paste/CSV
                                    </button>
                                </div>
                            </div>

                            {testInputMode === "MANUAL" ? (
                                <>
                                    <button type="button" className={styles.addQuestionBtn} onClick={addTestQuestion}>
                                        <Plus size={16} weight="bold" /> Add Question
                                    </button>
                                    <div className={styles.questionList}>
                                        {testForm.questions.map((question, questionIndex) => (
                                            <div key={question.id} className={styles.questionCard}>
                                                <div className={styles.questionHeader}>
                                                    <div>
                                                        <div className={styles.questionIndex}>Question {questionIndex + 1}</div>
                                                        <div className={styles.questionHint}>Students must answer this before submission.</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.inlineRemoveBtn}
                                                        onClick={() => removeTestQuestion(question.id)}
                                                        disabled={testForm.questions.length === 1}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.fieldLabel}>Question Text</label>
                                                    <textarea
                                                        className={styles.textarea}
                                                        required
                                                        rows={2}
                                                        value={question.text}
                                                        onChange={e => updateTestQuestion(question.id, e.target.value)}
                                                        placeholder="Type the question"
                                                    />
                                                </div>

                                                <div className={styles.optionGrid}>
                                                    {question.options.map((option, optionIndex) => (
                                                        <div key={optionIndex} className={styles.optionCard}>
                                                            <div className={styles.optionTop}>
                                                                <label className={styles.fieldLabel}>Option {String.fromCharCode(65 + optionIndex)}</label>
                                                                <label className={styles.correctToggle}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`correct-${question.id}`}
                                                                        checked={question.correctIndex === optionIndex}
                                                                        onChange={() => setCorrectOption(question.id, optionIndex)}
                                                                    />
                                                                    <span>Correct Answer</span>
                                                                </label>
                                                            </div>
                                                            <input
                                                                className={styles.input}
                                                                required
                                                                value={option}
                                                                onChange={e => updateTestOption(question.id, optionIndex, e.target.value)}
                                                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.bulkPanel}>
                                    <div className={styles.bulkHelpCard}>
                                        <div className={styles.bulkHelpTitle}>Bulk Input Format</div>
                                        <p>Paste one question per line using: <strong>Question | Option A | Option B | Option C | Option D | Correct Option</strong></p>
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
                                        <label className={styles.fieldLabel}>Bulk Questions</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={bulkQuestionText}
                                            onChange={event => setBulkQuestionText(event.target.value)}
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

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={resetTestModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={savingTest}>
                                    {savingTest ? <Spinner size={16} className={styles.spinner} /> : <Exam size={16} />}
                                    {savingTest ? "Creating..." : "Create Test"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAnnouncementModal && (
                <div className={styles.overlay} onClick={() => setShowAnnouncementModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Post Announcement</span>
                            <button className={styles.closeBtn} onClick={() => setShowAnnouncementModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleCreateAnnouncement}>
                            {announcementError ? <div className={styles.modalError}>{announcementError}</div> : null}

                            <label className={styles.fieldLabel}>Subject</label>
                            <input
                                className={styles.input}
                                required
                                value={announcementForm.title}
                                onChange={e => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
                            />

                            <label className={styles.fieldLabel}>Priority</label>
                            <div className={styles.customSelectWrap}>
                                <CustomSelect
                                    value={announcementForm.priority}
                                    onChange={(value) => setAnnouncementForm((prev) => ({ ...prev, priority: value }))}
                                    options={[
                                        { value: "LOW", label: "Low" },
                                        { value: "NORMAL", label: "Normal" },
                                        { value: "HIGH", label: "High" },
                                    ]}
                                />
                            </div>

                            <label className={styles.fieldLabel}>Message</label>
                            <textarea
                                className={styles.textarea}
                                required
                                rows={5}
                                value={announcementForm.content}
                                onChange={e => setAnnouncementForm((prev) => ({ ...prev, content: e.target.value }))}
                            />

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowAnnouncementModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={savingAnnouncement}>
                                    {savingAnnouncement ? <Spinner size={16} className={styles.spinner} /> : <Megaphone size={16} />}
                                    {savingAnnouncement ? "Posting..." : "Broadcast to Batch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAttendanceModal && (
                <div className={styles.overlay} onClick={() => setShowAttendanceModal(false)}>
                    <div className={`${styles.modal} ${styles.attendanceModal}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Mark Attendance</span>
                            <button className={styles.closeBtn} onClick={() => setShowAttendanceModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleMarkAttendance}>
                            {attendanceError ? <div className={styles.modalError}>{attendanceError}</div> : null}

                            <label className={styles.fieldLabel}>Date of Class</label>
                            <input
                                className={styles.input}
                                type="date"
                                required
                                value={attendanceDate}
                                onChange={e => {
                                    setAttendanceDate(e.target.value);
                                    void loadAttendanceForDate(e.target.value);
                                }}
                            />

                            <div className={styles.attendanceList}>
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.student.id} className={styles.attendanceRow}>
                                        <div className={styles.attendanceStudent}>
                                            <span className={styles.attendanceStudentName}>{enrollment.student.name}</span>
                                            <span className={styles.attendanceStudentEmail}>{enrollment.student.email || "No email"}</span>
                                        </div>
                                        <div className={styles.attendanceSelect}>
                                            <CustomSelect
                                                value={attendanceRecords[enrollment.student.id] || "PRESENT"}
                                                onChange={(value) => setAttendanceRecords((prev) => ({ ...prev, [enrollment.student.id]: value }))}
                                                options={[
                                                    { value: "PRESENT", label: "Present" },
                                                    { value: "ABSENT", label: "Absent" },
                                                    { value: "LATE", label: "Late" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {enrollments.length === 0 ? <div className={styles.attendanceEmpty}>No students enrolled in this batch.</div> : null}
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowAttendanceModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={savingAttendance}>
                                    {savingAttendance ? <Spinner size={16} className={styles.spinner} /> : <CalendarCheck size={16} />}
                                    {savingAttendance ? "Saving..." : "Save Attendance"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
