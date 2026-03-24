"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import ReactDateTimePicker from "@/components/lms/ReactDateTimePicker";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { ENDPOINTS } from "@/config/api";
import { Exam, Plus, MagnifyingGlass, ArrowRight, X, Spinner, PencilSimple, Trash } from "@/components/icons/lucide-phosphor";
import styles from "./tests.module.css";

type Batch = { id: string; name: string };
type TestQuestion = {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
};

type TeacherTest = {
    id: string;
    title: string;
    description?: string;
    totalMarks: number;
    durationMinutes: number;
    dueAt?: string | null;
    questions: TestQuestion[];
    totalQuestions: number;
    createdAt: string;
    batchId: string;
    batchName: string;
    courseName: string;
    attemptedStudents: number;
    totalStudents: number;
    pendingStudents: number;
};
type TestInputMode = "MANUAL" | "BULK";

const CORRECT_INDEX_BY_LABEL: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const MAX_BULK_QUESTIONS = 50;
const createEmptyTestQuestion = () => ({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
});

const mapQuestionsForForm = (questions?: TestQuestion[]) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return [createEmptyTestQuestion()];
    }

    return questions.map((question, index) => ({
        id: question.id || `q-${index + 1}-${Date.now()}`,
        text: question.text || "",
        options: Array.isArray(question.options) && question.options.length === 4
            ? question.options.map((option) => option || "")
            : ["", "", "", ""],
        correctIndex: Number.isInteger(question.correctIndex) ? question.correctIndex : 0,
    }));
};

const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === "\"") {
            if (inQuotes && line[i + 1] === "\"") {
                current += "\"";
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
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Bulk input is empty.");

    const firstLineLower = lines[0].toLowerCase();
    const isCsv = firstLineLower.includes("question") && firstLineLower.includes(",") && firstLineLower.includes("correct");
    const questions: Array<{ id: string; text: string; options: string[]; correctIndex: number }> = [];

    if (isCsv) {
        const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
        const required = ["question", "option_a", "option_b", "option_c", "option_d", "correct_option"];
        const map = new Map<string, number>();
        headers.forEach((header, index) => map.set(header, index));
        const missing = required.filter((header) => !map.has(header));
        if (missing.length) throw new Error(`Missing CSV header(s): ${missing.join(", ")}`);

        for (let row = 1; row < lines.length; row += 1) {
            const cols = parseCsvLine(lines[row]);
            const text = String(cols[map.get("question")!] || "").trim();
            const options = [
                String(cols[map.get("option_a")!] || "").trim(),
                String(cols[map.get("option_b")!] || "").trim(),
                String(cols[map.get("option_c")!] || "").trim(),
                String(cols[map.get("option_d")!] || "").trim(),
            ];
            const correctLabel = String(cols[map.get("correct_option")!] || "").trim().toUpperCase();
            const correctIndex = CORRECT_INDEX_BY_LABEL[correctLabel];
            if (!text) throw new Error(`CSV row ${row + 1}: question is required`);
            if (options.some((option) => !option)) throw new Error(`CSV row ${row + 1}: all 4 options are required`);
            if (!Number.isInteger(correctIndex)) throw new Error(`CSV row ${row + 1}: correct option must be A/B/C/D`);
            questions.push({ id: `q-${row}`, text, options, correctIndex });
        }
    } else {
        lines.forEach((line, index) => {
            const parts = line.split("|").map((part) => part.trim());
            if (parts.length !== 6) throw new Error(`Line ${index + 1}: expected 6 parts`);
            const [text, optionA, optionB, optionC, optionD, correctRaw] = parts;
            const correctIndex = CORRECT_INDEX_BY_LABEL[correctRaw.toUpperCase()];
            if (!text) throw new Error(`Line ${index + 1}: question is required`);
            if (!optionA || !optionB || !optionC || !optionD) throw new Error(`Line ${index + 1}: all 4 options are required`);
            if (!Number.isInteger(correctIndex)) throw new Error(`Line ${index + 1}: correct option must be A/B/C/D`);
            questions.push({ id: `q-${index + 1}`, text, options: [optionA, optionB, optionC, optionD], correctIndex });
        });
    }

    if (!questions.length) throw new Error("At least 1 question is required.");
    if (questions.length > MAX_BULK_QUESTIONS) throw new Error(`Maximum ${MAX_BULK_QUESTIONS} questions are allowed.`);
    return questions;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const formatDueDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatLocalDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getDefaultDueAt = () => {
    const today = new Date();
    return formatLocalDateValue(today);
};

const getTodayDateValue = () => formatLocalDateValue(new Date());

const parseLocalDueDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
        return null;
    }

    const parsed = new Date(year, month - 1, day, 23, 59, 59, 999);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function TeacherTestsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const bulkFileRef = useRef<HTMLInputElement>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [tests, setTests] = useState<TeacherTest[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedBatchFilter, setSelectedBatchFilter] = useState("");
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [savingTest, setSavingTest] = useState(false);
    const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [testInputMode, setTestInputMode] = useState<TestInputMode>("MANUAL");
    const [bulkQuestionText, setBulkQuestionText] = useState("");
    const [bulkCsvFileName, setBulkCsvFileName] = useState("");
    const [testForm, setTestForm] = useState({
        id: "",
        batchId: "",
        title: "",
        description: "",
        totalMarks: 100,
        durationMinutes: 60,
        dueAt: getDefaultDueAt(),
        questions: [createEmptyTestQuestion()],
    });

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    const fetchData = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const [testsResponse, batchesResponse] = await Promise.all([
                fetch(ENDPOINTS.Faculty.TESTS, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.Faculty.MY_BATCHES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const testsData = await testsResponse.json().catch(() => []);
            const batchesData = await batchesResponse.json().catch(() => []);
            const nextTests = Array.isArray(testsData) ? testsData : [];
            const nextBatches = Array.isArray(batchesData) ? batchesData : batchesData?.batches || [];
            setTests(nextTests);
            setBatches(nextBatches);
            setSelectedBatchFilter((current) => (
                nextBatches.some((batch: Batch) => batch.id === current)
                    ? current
                    : nextBatches[0]?.id || ""
            ));
            if (!testForm.batchId && nextBatches[0]?.id) {
                setTestForm((current) => ({ ...current, batchId: nextBatches[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch tests:", error);
            setTests([]);
            setBatches([]);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) void fetchData();
    }, [token]);

    const filteredTests = useMemo(() => {
        const query = search.trim().toLowerCase();
        return tests.filter((test) => {
            const matchesBatch = !selectedBatchFilter || test.batchId === selectedBatchFilter;
            const matchesSearch = !query || test.title.toLowerCase().includes(query) || test.batchName.toLowerCase().includes(query) || test.courseName.toLowerCase().includes(query);
            return matchesBatch && matchesSearch;
        });
    }, [tests, selectedBatchFilter, search]);

    const stats = useMemo(() => ({
        totalTests: tests.length,
        totalBatches: new Set(tests.map((test) => test.batchId)).size,
        totalAttempts: tests.reduce((sum, test) => sum + test.attemptedStudents, 0),
        pendingStudents: tests.reduce((sum, test) => sum + test.pendingStudents, 0),
    }), [tests]);

    const bulkPreview = useMemo(() => {
        if (!bulkQuestionText.trim()) return { count: 0, error: "" };
        try {
            return { count: parseBulkMcqQuestions(bulkQuestionText).length, error: "" };
        } catch (error: any) {
            return { count: 0, error: error?.message || "Invalid bulk format." };
        }
    }, [bulkQuestionText]);

    const openCreateModal = () => {
        setTestError(null);
        setTestInputMode("MANUAL");
        setBulkQuestionText("");
        setBulkCsvFileName("");
        setTestForm({
            id: "",
            batchId: selectedBatchFilter || batches[0]?.id || "",
            title: "",
            description: "",
            totalMarks: 100,
            durationMinutes: 60,
            dueAt: getDefaultDueAt(),
            questions: [createEmptyTestQuestion()],
        });
        setShowCreateModal(true);
    };

    const openEditModal = (test: TeacherTest) => {
        if (test.attemptedStudents > 0) {
            alert("Tests with student attempts cannot be edited.");
            return;
        }

        setTestError(null);
        setTestInputMode("MANUAL");
        setBulkQuestionText("");
        setBulkCsvFileName("");
        setTestForm({
            id: test.id,
            batchId: test.batchId,
            title: test.title,
            description: test.description || "",
            totalMarks: test.totalMarks,
            durationMinutes: test.durationMinutes,
            dueAt: (() => {
                if (!test.dueAt) return getDefaultDueAt();
                const dueDateValue = formatLocalDateValue(new Date(test.dueAt));
                return dueDateValue < getTodayDateValue() ? getTodayDateValue() : dueDateValue;
            })(),
            questions: mapQuestionsForForm(test.questions),
        });
        setShowCreateModal(true);
    };

    const resetCreateModal = () => {
        setShowCreateModal(false);
        setSavingTest(false);
        setTestError(null);
        setTestInputMode("MANUAL");
        setBulkQuestionText("");
        setBulkCsvFileName("");
        if (bulkFileRef.current) bulkFileRef.current.value = "";
    };

    const addQuestion = () => {
        setTestForm((prev) => ({
            ...prev,
            questions: [...prev.questions, createEmptyTestQuestion()],
        }));
    };

    const removeQuestion = (questionId: string) => {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.length > 1
                ? prev.questions.filter((question) => question.id !== questionId)
                : prev.questions,
        }));
    };

    const updateQuestion = (questionId: string, value: string) => {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => (
                question.id === questionId ? { ...question, text: value } : question
            )),
        }));
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => {
                if (question.id !== questionId) return question;
                const nextOptions = [...question.options];
                nextOptions[optionIndex] = value;
                return { ...question, options: nextOptions };
            }),
        }));
    };

    const setCorrectOption = (questionId: string, optionIndex: number) => {
        setTestForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question) => (
                question.id === questionId ? { ...question, correctIndex: optionIndex } : question
            )),
        }));
    };

    const handleBulkCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setBulkCsvFileName("");
            return;
        }
        const text = await file.text();
        setBulkQuestionText(text);
        setBulkCsvFileName(file.name);
    };

    const handleSaveTest = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) return;
        setSavingTest(true);
        setTestError(null);
        try {
            if (!testForm.dueAt) {
                throw new Error("Due date is required");
            }

            const normalizedDueAt = parseLocalDueDate(testForm.dueAt);
            if (!normalizedDueAt) {
                throw new Error("Enter a valid due date");
            }

            const questions = testInputMode === "BULK"
                ? parseBulkMcqQuestions(bulkQuestionText)
                : testForm.questions;

            const endpoint = testForm.id
                ? ENDPOINTS.Faculty.UPDATE_TEST(testForm.id)
                : ENDPOINTS.Faculty.CREATE_TEST;
            const method = testForm.id ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...testForm, dueAt: normalizedDueAt.toISOString(), questions }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const message = Array.isArray(data?.errors) && data.errors.length ? data.errors.slice(0, 3).join("\n") : data?.message || `Unable to ${testForm.id ? "update" : "create"} test`;
                throw new Error(message);
            }
            resetCreateModal();
            await fetchData();
        } catch (error) {
            console.error(error);
            setTestError(error instanceof Error ? error.message : `Unable to ${testForm.id ? "update" : "create"} test`);
        } finally {
            setSavingTest(false);
        }
    };

    const handleDeleteTest = async (test: TeacherTest) => {
        if (!token) return;
        if (test.attemptedStudents > 0) {
            alert("Tests with student attempts cannot be deleted.");
            return;
        }

        if (!confirm(`Delete "${test.title}"?`)) {
            return;
        }

        setDeletingTestId(test.id);
        try {
            const response = await fetch(ENDPOINTS.Faculty.DELETE_TEST(test.id), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to delete test");
            }
            await fetchData();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to delete test");
        } finally {
            setDeletingTestId(null);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Tests">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Tests Dashboard</div>
                        <div className={styles.bannerSub}>Create tests, filter them by batch, and view all published assessments from one place.</div>
                    </div>
                    <button type="button" className={styles.bannerAction} onClick={openCreateModal}>
                        <Plus size={18} weight="bold" /> Create Test
                    </button>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}><span className={styles.statValue}>{stats.totalTests}</span><span className={styles.statLabel}>Total Tests</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{stats.totalBatches}</span><span className={styles.statLabel}>Batches Covered</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{stats.totalAttempts}</span><span className={styles.statLabel}>Student Attempts</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{stats.pendingStudents}</span><span className={styles.statLabel}>Pending Students</span></div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.filterWrap}>
                        <CustomSelect
                            value={selectedBatchFilter}
                            onChange={setSelectedBatchFilter}
                            options={
                                batches.length > 0
                                    ? batches.map((batch) => ({ value: batch.id, label: batch.name }))
                                    : [{ value: "", label: "No batches" }]
                            }
                        />
                    </div>
                    
                </div>

                {loadingData ? (
                    <div className={styles.emptyState}>Loading tests...</div>
                ) : filteredTests.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Exam size={46} color="#cbd5e1" weight="duotone" />
                        <div>No tests created yet for the selected batch.</div>
                        <button type="button" className={styles.emptyAction} onClick={openCreateModal}>
                            <Plus size={16} weight="bold" /> Create Test
                        </button>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.testsTable}>
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Batch</th>
                                    <th>Questions</th>
                                    <th>Marks</th>
                                    <th>Duration</th>
                                    <th>Due Date</th>
                                    <th>Attempts</th>
                                    <th>Pending</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTests.map((test) => (
                                    <tr key={test.id}>
                                        <td>
                                            <div className={styles.tableTitleCell}>
                                                <div className={styles.tableTitle}>{test.title}</div>
                                                <div className={styles.tableDescription}>
                                                    {test.description || "MCQ assessment published for students."}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.tableMetaCell}>
                                                <span className={styles.tableCourse}>{test.courseName}</span>
                                                <span className={styles.tableBatch}>{test.batchName}</span>
                                            </div>
                                        </td>
                                        <td>{test.totalQuestions}</td>
                                        <td>{test.totalMarks}</td>
                                        <td>{test.durationMinutes} min</td>
                                        <td>{test.dueAt ? formatDueDate(test.dueAt) : "-"}</td>
                                        <td>{test.attemptedStudents}/{test.totalStudents}</td>
                                        <td>{test.pendingStudents}</td>
                                        <td>{formatDate(test.createdAt)}</td>
                                        <td>
                                            <div className={styles.actionGroup}>
                                                <Link href={`/faculty/tests/${test.id}/results`} className={styles.viewBtn}>
                                                    View Results <ArrowRight size={14} />
                                                </Link>
                                                <div className={styles.actionIconRow}>
                                                    <button
                                                        type="button"
                                                        className={styles.editBtn}
                                                        onClick={() => openEditModal(test)}
                                                        disabled={test.attemptedStudents > 0}
                                                        title={test.attemptedStudents > 0 ? "Tests with attempts cannot be edited" : "Edit test"}
                                                        aria-label="Edit test"
                                                    >
                                                        <PencilSimple size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDeleteTest(test)}
                                                        disabled={test.attemptedStudents > 0 || deletingTestId === test.id}
                                                        title={test.attemptedStudents > 0 ? "Tests with attempts cannot be deleted" : deletingTestId === test.id ? "Deleting test" : "Delete test"}
                                                        aria-label={deletingTestId === test.id ? "Deleting test" : "Delete test"}
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className={styles.overlay} onClick={resetCreateModal}>
                    <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>{testForm.id ? "Edit MCQ Assessment" : "New MCQ Assessment"}</span>
                            <button type="button" className={styles.closeBtn} onClick={resetCreateModal}><X size={18} /></button>
                        </div>
                        <form className={styles.modalForm} onSubmit={handleSaveTest}>
                            {testError ? <div className={styles.modalError}>{testError}</div> : null}
                            <div className={styles.formGroup}>
                                <label className={styles.fieldLabel}>Test Title </label>
                                <input className={styles.input} required value={testForm.title} onChange={(event) => setTestForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Module 1 Practice Test" />
                            </div>
                            <div className={styles.metaGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Due Date </label>
                                    <ReactDateTimePicker
                                        required
                                        variant="soft"
                                        mode="date"
                                        value={testForm.dueAt}
                                        minDate={getTodayDateValue()}
                                        onChange={(value) => setTestForm((current) => ({ ...current, dueAt: value }))}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Batch </label>
                                    <CustomSelect value={testForm.batchId} onChange={(value) => setTestForm((current) => ({ ...current, batchId: value }))} options={[{ value: "", label: "Select batch" }, ...batches.map((batch) => ({ value: batch.id, label: batch.name }))]} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Total Marks </label>
                                    <input className={styles.input} type="number" min="1" required value={testForm.totalMarks} onChange={(event) => setTestForm((current) => ({ ...current, totalMarks: parseInt(event.target.value || "0", 10) }))} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel}>Duration (Minutes) </label>
                                    <input className={styles.input} type="number" min="1" required value={testForm.durationMinutes} onChange={(event) => setTestForm((current) => ({ ...current, durationMinutes: parseInt(event.target.value || "0", 10) }))} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.fieldLabel}>Student Instructions</label>
                                <textarea className={styles.textarea} rows={3} value={testForm.description} onChange={(event) => setTestForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add instructions students should read before starting the test" />
                            </div>
                            <div className={styles.testHeaderRow}>
                                <div>
                                    <div className={styles.testSectionTitle}>MCQ Questions</div>
                                    <div className={styles.testSectionSub}>Each question needs 4 options and exactly 1 correct answer.</div>
                                </div>
                                <div className={styles.modeSwitch}>
                                    <button type="button" className={`${styles.modeBtn} ${testInputMode === "MANUAL" ? styles.modeBtnActive : ""}`} onClick={() => setTestInputMode("MANUAL")}>Manual</button>
                                    <button type="button" className={`${styles.modeBtn} ${testInputMode === "BULK" ? styles.modeBtnActive : ""}`} onClick={() => setTestInputMode("BULK")}>Bulk Paste/CSV</button>
                                </div>
                            </div>

                            {testInputMode === "MANUAL" ? (
                                <>
                                    <button type="button" className={styles.addQuestionBtn} onClick={addQuestion}>
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
                                                    <button type="button" className={styles.inlineRemoveBtn} onClick={() => removeQuestion(question.id)} disabled={testForm.questions.length === 1}>Remove</button>
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label className={styles.fieldLabel}>Question Text</label>
                                                    <textarea className={styles.textarea} required rows={2} value={question.text} onChange={(event) => updateQuestion(question.id, event.target.value)} placeholder="Type the question" />
                                                </div>
                                                <div className={styles.optionGrid}>
                                                    {question.options.map((option, optionIndex) => (
                                                        <div key={optionIndex} className={styles.optionCard}>
                                                            <div className={styles.optionTop}>
                                                                <label className={styles.fieldLabel}>Option {String.fromCharCode(65 + optionIndex)}</label>
                                                                <label className={styles.correctToggle}>
                                                                    <input type="radio" name={`correct-${question.id}`} checked={question.correctIndex === optionIndex} onChange={() => setCorrectOption(question.id, optionIndex)} />
                                                                    <span>Correct Answer</span>
                                                                </label>
                                                            </div>
                                                            <input className={styles.input} required value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.bulkHelp}>
                                        <div className={styles.bulkHelpTitle}>Bulk Format</div>
                                        <p>Use one line per question: <strong>Question | Option A | Option B | Option C | Option D | Correct Option</strong></p>
                                        <p>Or upload CSV with headers: <code>question,option_a,option_b,option_c,option_d,correct_option</code></p>
                                    </div>
                                    <div className={styles.bulkUploadRow}>
                                        <label className={styles.bulkUploadLabel}>
                                            Upload CSV
                                            <input ref={bulkFileRef} type="file" accept=".csv,text/csv" onChange={handleBulkCsvUpload} />
                                        </label>
                                        {bulkCsvFileName ? <span className={styles.bulkFileName}>Loaded: {bulkCsvFileName}</span> : null}
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>Questions *</label>
                                        <textarea className={styles.bulkTextarea} rows={10} value={bulkQuestionText} onChange={(event) => setBulkQuestionText(event.target.value)} placeholder="Paste MCQs here..." required={testInputMode === "BULK"} />
                                        <div className={styles.bulkPreviewRow}>
                                            <span className={styles.bulkPreviewCount}>Detected Questions: {bulkPreview.count}</span>
                                            {bulkPreview.error ? <span className={styles.bulkPreviewError}>{bulkPreview.error}</span> : null}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={resetCreateModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={savingTest}>
                                    {savingTest ? <Spinner size={16} className={styles.spinner} /> : <Exam size={16} />}
                                    {savingTest ? (testForm.id ? "Saving..." : "Creating...") : (testForm.id ? "Save Test" : "Create Test")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
