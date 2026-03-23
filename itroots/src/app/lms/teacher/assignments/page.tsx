"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { API_BASE_URL, ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import {
    ClipboardText,
    Plus,
    MagnifyingGlass,
    X,
    UploadSimple,
    Spinner,
    FileText,
    FolderOpen,
    PencilSimpleLine,
    Trash,
    Eye,
    UsersThree,
    WarningCircle,
} from "@/components/icons/lucide-phosphor";
import styles from "./teacher-assignments.module.css";

type Batch = {
    id: string;
    name: string;
    course?: {
        id: string;
        title: string;
    };
};

type AssignmentRecord = {
    id: string;
    title: string;
    description?: string;
    contentUrl: string;
    createdAt: string;
    batchId: string;
    batchName: string;
    courseName: string;
    maxMarks: number;
    hasSubmissions: boolean;
    submissionStats: {
        totalSubmitted: number;
        pendingReview: number;
        reviewed: number;
        totalEligibleStudents: number;
        unsubmitted: number;
    };
};

const BACKEND_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return "";
    }
})();

const resolveFileUrl = (value?: string) => {
    const url = String(value || "").trim();
    if (!url) return "#";
    try {
        return new URL(url).toString();
    } catch {
        return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
    }
};

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const normalizeAssignmentsPayload = (payload: unknown): AssignmentRecord[] => {
    if (Array.isArray(payload)) {
        return payload as AssignmentRecord[];
    }

    if (payload && typeof payload === "object") {
        const shapedPayload = payload as { data?: unknown; assignments?: unknown };
        if (Array.isArray(shapedPayload.data)) {
            return shapedPayload.data as AssignmentRecord[];
        }
        if (Array.isArray(shapedPayload.assignments)) {
            return shapedPayload.assignments as AssignmentRecord[];
        }
    }

    return [];
};

const normalizeBatchesPayload = (payload: unknown): Batch[] => {
    if (Array.isArray(payload)) {
        return payload as Batch[];
    }

    if (payload && typeof payload === "object") {
        const shapedPayload = payload as { data?: unknown; batches?: unknown };
        if (Array.isArray(shapedPayload.data)) {
            return shapedPayload.data as Batch[];
        }
        if (Array.isArray(shapedPayload.batches)) {
            return shapedPayload.batches as Batch[];
        }
    }

    return [];
};

const buildAssignmentRecord = (payload: any, batches: Batch[]): AssignmentRecord | null => {
    if (!payload?.id) return null;

    const batch = batches.find((item) => item.id === payload.batchId);

    return {
        id: String(payload.id),
        title: String(payload.title || "").trim() || "Untitled Assignment",
        description: String(payload.description || "").trim(),
        contentUrl: String(payload.contentUrl || "").trim(),
        createdAt: String(payload.createdAt || new Date().toISOString()),
        batchId: String(payload.batchId || ""),
        batchName: String(payload.batchName || batch?.name || "Batch"),
        courseName: String(payload.courseName || batch?.course?.title || "Course"),
        maxMarks: Number(payload.maxMarks || 100),
        hasSubmissions: Boolean(payload.hasSubmissions),
        submissionStats: {
            totalSubmitted: Number(payload.submissionStats?.totalSubmitted || 0),
            pendingReview: Number(payload.submissionStats?.pendingReview || 0),
            reviewed: Number(payload.submissionStats?.reviewed || 0),
            totalEligibleStudents: Number(payload.submissionStats?.totalEligibleStudents || 0),
            unsubmitted: Number(payload.submissionStats?.unsubmitted || 0),
        },
    };
};

const upsertAssignmentRecord = (current: AssignmentRecord[], next: AssignmentRecord) => {
    const existingIndex = current.findIndex((item) => item.id === next.id);
    if (existingIndex === -1) {
        return [next, ...current];
    }

    const updated = [...current];
    updated[existingIndex] = next;
    return updated;
};

export default function FacultyAssignmentsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<AssignmentRecord | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [form, setForm] = useState({
        batchId: "",
        title: "",
        description: "",
        maxMarks: "100",
    });

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    const fetchAssignments = async ({ suppressMessage = false }: { suppressMessage?: boolean } = {}) => {
        if (!token) return false;
        setLoadingData(true);
        try {
            const [assignmentsResponse, batchesResponse] = await Promise.all([
                fetch(ENDPOINTS.Faculty.ASSIGNMENTS, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(ENDPOINTS.Faculty.MY_BATCHES, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const assignmentsData = await assignmentsResponse.json().catch(() => null);
            const batchesData = await batchesResponse.json().catch(() => null);

            if (!assignmentsResponse.ok) {
                throw new Error((assignmentsData as { message?: string } | null)?.message || "Unable to load assignments");
            }

            if (!batchesResponse.ok) {
                throw new Error((batchesData as { message?: string } | null)?.message || "Unable to load batches");
            }

            const normalizedAssignments = normalizeAssignmentsPayload(assignmentsData);
            const normalizedBatches = normalizeBatchesPayload(batchesData);

            setAssignments(normalizedAssignments);
            setBatches(normalizedBatches);
            return true;
        } catch (error) {
            console.error("Failed to fetch faculty assignments:", error);
            setAssignments([]);
            setBatches([]);
            if (!suppressMessage) {
                setPageMessage(error instanceof Error ? error.message : "Unable to load assignments right now.");
            }
            return false;
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchAssignments();
        }
    }, [token]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const matchesBatch = selectedBatchFilter === "ALL" || assignment.batchId === selectedBatchFilter;
            const query = search.trim().toLowerCase();
            const matchesSearch = !query
                || assignment.title.toLowerCase().includes(query)
                || assignment.batchName.toLowerCase().includes(query)
                || assignment.courseName.toLowerCase().includes(query);
            return matchesBatch && matchesSearch;
        });
    }, [assignments, search, selectedBatchFilter]);

    const summary = useMemo(() => ({
        totalAssignments: assignments.length,
        totalSubmitted: assignments.reduce((sum, assignment) => sum + assignment.submissionStats.totalSubmitted, 0),
        totalUnsubmitted: assignments.reduce((sum, assignment) => sum + assignment.submissionStats.unsubmitted, 0),
        totalPendingReview: assignments.reduce((sum, assignment) => sum + assignment.submissionStats.pendingReview, 0),
    }), [assignments]);

    const isEditMode = Boolean(editingAssignment);
    const hasSubmissionLock = Boolean(editingAssignment?.hasSubmissions);

    const resetModal = () => {
        setShowModal(false);
        setEditingAssignment(null);
        setSubmitting(false);
        setFormError(null);
        setFile(null);
        setForm({
            batchId: selectedBatchFilter !== "ALL" ? selectedBatchFilter : batches[0]?.id || "",
            title: "",
            description: "",
            maxMarks: "100",
        });
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    };

    const openCreateModal = () => {
        setFormError(null);
        setFile(null);
        setEditingAssignment(null);
        setForm({
            batchId: selectedBatchFilter !== "ALL" ? selectedBatchFilter : batches[0]?.id || "",
            title: "",
            description: "",
            maxMarks: "100",
        });
        setShowModal(true);
    };

    const openEditModal = (assignment: AssignmentRecord) => {
        setFormError(null);
        setFile(null);
        setEditingAssignment(assignment);
        setForm({
            batchId: assignment.batchId,
            title: assignment.title,
            description: assignment.description || "",
            maxMarks: String(assignment.maxMarks || 100),
        });
        setShowModal(true);
    };

    const handleSaveAssignment = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) return;

        setPageMessage(null);

        if (!form.batchId) {
            setFormError("Please select a batch.");
            return;
        }

        const numericMaxMarks = Number(form.maxMarks);
        if (!Number.isInteger(numericMaxMarks) || numericMaxMarks <= 0) {
            setFormError("Max marks must be a positive whole number.");
            return;
        }

        if (!isEditMode && !file) {
            setFormError("Please upload the assignment file.");
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            const payload: Record<string, unknown> = {
                batchId: form.batchId,
                title: form.title.trim(),
                description: form.description.trim(),
                maxMarks: numericMaxMarks,
            };

            if (!isEditMode) {
                payload.type = "ASSIGNMENT";
            }

            if (file) {
                payload.fileName = file.name;
                payload.fileData = await readFileAsBase64(file);
            }

            const endpoint = isEditMode
                ? ENDPOINTS.Faculty.UPDATE_CONTENT(editingAssignment!.id)
                : ENDPOINTS.Faculty.ADD_CONTENT;

            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || (isEditMode ? "Unable to update assignment" : "Unable to upload assignment"));
            }

            const optimisticRecord = buildAssignmentRecord(data?.data ?? data, batches);
            resetModal();
            const refreshed = await fetchAssignments({ suppressMessage: true });

            if (!refreshed && optimisticRecord) {
                setAssignments((current) => upsertAssignmentRecord(current, optimisticRecord));
            }

            setPageMessage(isEditMode ? "Assignment updated successfully." : "Assignment uploaded successfully.");
        } catch (error) {
            console.error(error);
            setFormError(error instanceof Error ? error.message : "Unable to save assignment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (assignment: AssignmentRecord) => {
        if (!token) return;

        if (assignment.hasSubmissions) {
            setPageMessage("Assignments with student submissions cannot be deleted.");
            return;
        }

        const confirmed = window.confirm(`Delete "${assignment.title}"?`);
        if (!confirmed) return;

        try {
            const response = await fetch(ENDPOINTS.Faculty.DELETE_CONTENT(assignment.id), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to delete assignment");
            }

            const refreshed = await fetchAssignments({ suppressMessage: true });
            if (!refreshed) {
                setAssignments((current) => current.filter((item) => item.id !== assignment.id));
            }
            setPageMessage("Assignment deleted successfully.");
        } catch (error) {
            console.error(error);
            setPageMessage(error instanceof Error ? error.message : "Unable to delete assignment");
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Assignments">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Assignments</div>
                        <div className={styles.bannerSub}>Upload assignments batch-wise, track student submissions.</div>
                    </div>
                    <button type="button" className={styles.bannerAction} onClick={openCreateModal}>
                        <Plus size={18} weight="bold" /> Upload Assignment
                    </button>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{summary.totalAssignments}</span>
                        <span className={styles.statLabel}>Uploaded Assignments</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{summary.totalSubmitted}</span>
                        <span className={styles.statLabel}>Submitted</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{summary.totalUnsubmitted}</span>
                        <span className={styles.statLabel}>Unsubmitted</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{summary.totalPendingReview}</span>
                        <span className={styles.statLabel}>Pending Review</span>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.filterWrap}>
                        <CustomSelect
                            value={selectedBatchFilter}
                            onChange={setSelectedBatchFilter}
                            options={[
                                { value: "ALL", label: "All Batches" },
                                ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
                            ]}
                        />
                    </div>
                    <div className={styles.searchWrap}>
                        <MagnifyingGlass size={16} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search assignments..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                {pageMessage ? (
                    <div className={styles.noticeBar}>
                        <WarningCircle size={18} weight="fill" />
                        <span>{pageMessage}</span>
                    </div>
                ) : null}

                {loadingData ? (
                    <div className={styles.emptyState}>Loading assignments...</div>
                ) : filteredAssignments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FolderOpen size={44} color="#cbd5e1" weight="duotone" />
                        <div>No assignments uploaded for the selected batch yet.</div>
                        <button type="button" className={styles.emptyUploadBtn} onClick={openCreateModal}>
                            <Plus size={16} weight="bold" /> Upload Assignment
                        </button>
                    </div>
                ) : (
                    <div className={styles.assignmentGrid}>
                        {filteredAssignments.map((assignment) => (
                            <article key={assignment.id} className={styles.assignmentCard}>
                                <div className={styles.assignmentTop}>
                                    <div className={styles.assignmentIcon}>
                                        <FileText size={22} weight="duotone" />
                                    </div>
                                    <div className={styles.assignmentMeta}>
                                        <div className={styles.assignmentBatch}>{assignment.courseName} </div>
                                        <h3>{assignment.title}</h3>
                                        <p>{assignment.description || "Assignment uploaded for students."}</p>
                                    </div>
                                </div>

                                <div className={styles.assignmentStats}>
                                    <span className={styles.assignmentChip}>Max Marks: {assignment.maxMarks}</span>
                                    <span className={styles.assignmentChip}>Submitted: {assignment.submissionStats.totalSubmitted}</span>
                                    <span className={styles.assignmentChip}>Unsubmitted: {assignment.submissionStats.unsubmitted}</span>
                                    <span className={styles.assignmentChip}>Pending Review: {assignment.submissionStats.pendingReview}</span>
                                </div>

                                <div className={styles.assignmentFooter}>
                                    <span className={styles.assignmentDate}>Uploaded on {formatDate(assignment.createdAt)}</span>
                                    <div className={styles.actionGroup}>
                                        
                                        <button type="button" className={styles.secondaryActionBtn} onClick={() => openEditModal(assignment)}>
                                            <PencilSimpleLine size={15} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.secondaryActionBtn} ${styles.deleteActionBtn}`}
                                            onClick={() => void handleDelete(assignment)}
                                            disabled={assignment.hasSubmissions}
                                            title={assignment.hasSubmissions ? "Assignments with submissions cannot be deleted" : "Delete assignment"}
                                        >
                                            <Trash size={15} /> Delete
                                        </button>
                                        <Link href={`/assignments/${assignment.id}`} className={styles.primaryActionBtn}>
                                            <UsersThree size={15} /> Open Submissions
                                        </Link>
                                        <a
                                            href={resolveFileUrl(assignment.contentUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.viewBtn}
                                        >
                                            <Eye size={15} /> View
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className={styles.overlay} onClick={resetModal}>
                    <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <div className={styles.modalTitle}>{isEditMode ? "Edit Assignment" : "Upload Assignment"}</div>
                                <div className={styles.modalSub}>
                                    {isEditMode
                                        ? "Update assignment details. Batch, file, and max marks lock after students submit."
                                        : "Students will see this assignment in their LMS dashboard."}
                                </div>
                            </div>
                            <button type="button" className={styles.closeBtn} onClick={resetModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleSaveAssignment}>
                            {formError ? <div className={styles.modalError}>{formError}</div> : null}

                            <div>
                                <label className={styles.fieldLabel}>Select Batch </label>
                                <div className={styles.selectWrap}>
                                    <CustomSelect
                                        value={form.batchId}
                                        onChange={(value) => setForm((current) => ({ ...current, batchId: value }))}
                                        placeholder="Select batch"
                                        disabled={hasSubmissionLock}
                                        options={[
                                            { value: "", label: "Select batch" },
                                            ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
                                        ]}
                                    />
                                </div>
                                {hasSubmissionLock ? <div className={styles.helperText}>Batch cannot be changed after students submit.</div> : null}
                            </div>

                            <div className={styles.formGrid}>
                                <div>
                                    <label className={styles.fieldLabel}>Assignment Title </label>
                                    <input
                                        className={styles.input}
                                        value={form.title}
                                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                        placeholder="e.g. Java Mini Project Brief"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={styles.fieldLabel}>Max Marks </label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={form.maxMarks}
                                        onChange={(event) => setForm((current) => ({ ...current, maxMarks: event.target.value }))}
                                        placeholder="100"
                                        disabled={hasSubmissionLock}
                                        required
                                    />
                                    {hasSubmissionLock ? <div className={styles.helperText}>Max marks cannot be changed after students submit.</div> : null}
                                </div>
                            </div>

                            <div>
                                <label className={styles.fieldLabel}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    placeholder="Instructions for students..."
                                />
                            </div>

                            <div>
                                <label className={styles.fieldLabel}>Assignment File</label>
                                <div
                                    className={`${styles.dropZone} ${hasSubmissionLock ? styles.dropZoneDisabled : ""}`}
                                    onClick={() => {
                                        if (!hasSubmissionLock) fileRef.current?.click();
                                    }}
                                >
                                    {file ? (
                                        <span className={styles.fileName}>{file.name}</span>
                                    ) : (
                                        <>
                                            <UploadSimple size={24} color="#94a3b8" />
                                            <span>{isEditMode ? "Click to replace the assignment file" : "Click to upload assignment file"}</span>
                                            <small>PDF, DOC, etc.</small>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    style={{ display: "none" }}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    disabled={hasSubmissionLock}
                                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                />
                                {hasSubmissionLock ? <div className={styles.helperText}>File replacement is disabled after students submit.</div> : null}
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={resetModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Spinner size={16} className={styles.spinner} /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <UploadSimple size={16} weight="bold" /> {isEditMode ? "Save Changes" : "Upload Assignment"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
