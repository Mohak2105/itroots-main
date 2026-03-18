"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref } from "@/utils/studentContentViewer";
import {
    CheckCircle,
    ClipboardText,
    Trophy,
    ChatCircleDots,
    Paperclip,
    HourglassMedium,
    Link as LinkIcon,
} from "@phosphor-icons/react";
import styles from "./assignments.module.css";

type AssignmentItem = {
    id: string;
    title: string;
    description?: string;
    batchId: string;
    batchName: string;
    courseName: string;
    maxMarks: number;
    assignmentFileUrl: string;
    uploadedAt: string;
    submission?: {
        id: string;
        fileUrl: string;
        fileName: string;
        notes?: string;
        status: "SUBMITTED" | "REVIEWED";
        grade?: number | null;
        feedback?: string | null;
        submittedAt: string;
    } | null;
};

export default function StudentAssignmentsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");
    const [selectedFiles, setSelectedFiles] = useState<Record<string, { fileName: string; fileData: string }>>({});
    const [notesByAssignment, setNotesByAssignment] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/student/login");
    }, [user, isLoading, router]);

    const fetchAssignments = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const response = await fetch(ENDPOINTS.STUDENT.ASSIGNMENTS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setAssignments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchAssignments();
        }
    }, [token]);

    const pendingList = useMemo(() => assignments.filter((item) => !item.submission), [assignments]);
    const submittedList = useMemo(() => assignments.filter((item) => item.submission), [assignments]);
    const displayed = activeTab === "pending" ? pendingList : submittedList;
    const formatDate = (value?: string) =>
        value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

    const handleFileChange = async (assignmentId: string, file?: File) => {
        if (!file) {
            setSelectedFiles((current) => {
                const next = { ...current };
                delete next[assignmentId];
                return next;
            });
            return;
        }

        const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

        setSelectedFiles((current) => ({
            ...current,
            [assignmentId]: {
                fileName: file.name,
                fileData,
            },
        }));
    };

    const handleSubmit = async (assignmentId: string) => {
        if (!token) return;
        const selectedFile = selectedFiles[assignmentId];
        if (!selectedFile) {
            alert("Choose a file before submitting the assignment.");
            return;
        }

        setUploadingId(assignmentId);
        try {
            const response = await fetch(ENDPOINTS.STUDENT.SUBMIT_ASSIGNMENT(assignmentId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fileName: selectedFile.fileName,
                    fileData: selectedFile.fileData,
                    notes: notesByAssignment[assignmentId] || "",
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Unable to submit assignment");
            }

            setSelectedFiles((current) => {
                const next = { ...current };
                delete next[assignmentId];
                return next;
            });
            setNotesByAssignment((current) => ({ ...current, [assignmentId]: "" }));
            await fetchAssignments();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to submit assignment");
        } finally {
            setUploadingId(null);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Assignments">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}> My Assignments</div>
                        <div className={styles.bannerSub}>
                            View and submit your assignments for your enrolled courses.
                        </div>
                    </div>
                    <ClipboardText size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "pending" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("pending")}
                        type="button"
                    >
                        Pending <span className={styles.tabCount}>{pendingList.length}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "submitted" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("submitted")}
                        type="button"
                    >
                        Submitted <span className={styles.tabCount}>{submittedList.length}</span>
                    </button>
                </div>

                <div className={styles.assignmentsList}>
                    {loadingData ? (
                        <div className={styles.emptyState}>
                            <ClipboardText size={52} color="#cbd5e1" weight="duotone" />
                            <h3>Loading assignments</h3>
                            <p>Please wait while your assignment list is loading.</p>
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className={styles.emptyState}>
                            <ClipboardText size={52} color="#cbd5e1" weight="duotone" />
                            <h3>{activeTab === "pending" ? "No Pending Assignments" : "No Submitted Assignments"}</h3>
                            <p>{activeTab === "pending" ? "Great job. You are all caught up." : "Submit an assignment to see it here."}</p>
                        </div>
                    ) : (
                        <div className={styles.tableCard}>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        {activeTab === "pending" ? (
                                            <tr>
                                                <th>Assignment</th>
                                                <th>Course / Batch</th>
                                                <th>Posted</th>
                                                <th>Status</th>
                                                <th>Submission</th>
                                                <th>Action</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th>Assignment</th>
                                                <th>Course / Batch</th>
                                                <th>Submitted On</th>
                                                <th>Status</th>
                                                <th>Score</th>
                                                <th>Action</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody>
                                        {displayed.map((assignment) => {
                                            const submitted = Boolean(assignment.submission);
                                            const reviewComplete = assignment.submission?.status === "REVIEWED";
                                            const selectedFile = selectedFiles[assignment.id];
                                            const isUploading = uploadingId === assignment.id;

                                            if (!submitted) {
                                                return (
                                                    <tr key={assignment.id}>
                                                        <td>
                                                            <div className={styles.assignmentCell}>
                                                                <div className={styles.assignmentTitleRow}>
                                                                    <ClipboardText size={18} color="#0881ec" weight="fill" />
                                                                    <span className={styles.assignmentName}>{assignment.title}</span>
                                                                </div>
                                                                <div className={styles.assignmentText}>
                                                                    {assignment.description || "No assignment description provided."}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={styles.batchCell}>
                                                                <strong>{assignment.courseName}</strong>
                                                                <span>{assignment.batchName}</span>
                                                            </div>
                                                        </td>
                                                        <td>{formatDate(assignment.uploadedAt)}</td>
                                                        <td>
                                                            <span className={`${styles.statusChip} ${styles.chipBlue}`}>Pending</span>
                                                        </td>
                                                        <td>
                                                            <div className={styles.submissionCell}>
                                                                <label className={styles.fileLabel} htmlFor={`file-${assignment.id}`}>
                                                                    <Paperclip size={16} /> Choose File
                                                                    <input
                                                                        type="file"
                                                                        id={`file-${assignment.id}`}
                                                                        className={styles.fileInput}
                                                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.txt,.py,.java,.js,.ts,.tsx,.jsx,.png,.jpg,.jpeg"
                                                                        onChange={(event) => void handleFileChange(assignment.id, event.target.files?.[0])}
                                                                    />
                                                                </label>
                                                                {selectedFile ? <span className={styles.fileName}>{selectedFile.fileName}</span> : null}
                                                                <textarea
                                                                    className={styles.notesInput}
                                                                    rows={2}
                                                                    placeholder="Notes for faculty (optional)"
                                                                    value={notesByAssignment[assignment.id] || ""}
                                                                    onChange={(event) => setNotesByAssignment((current) => ({ ...current, [assignment.id]: event.target.value }))}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={styles.actionCell}>
                                                                <Link href={buildStudentContentViewerHref(assignment.assignmentFileUrl, assignment.title)} className={styles.openBtn}>
                                                                    Open Assignment <LinkIcon size={14} />
                                                                </Link>
                                                                <button
                                                                    className={styles.submitBtn}
                                                                    onClick={() => void handleSubmit(assignment.id)}
                                                                    disabled={isUploading}
                                                                    type="button"
                                                                >
                                                                    {isUploading ? (
                                                                        <><HourglassMedium size={16} /> Submitting...</>
                                                                    ) : (
                                                                        "Submit"
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={assignment.id}>
                                                    <td>
                                                        <div className={styles.assignmentCell}>
                                                            <div className={styles.assignmentTitleRow}>
                                                                {reviewComplete ? (
                                                                    <CheckCircle size={18} color="#10b981" weight="fill" />
                                                                ) : (
                                                                    <HourglassMedium size={18} color="#f59e0b" weight="fill" />
                                                                )}
                                                                <span className={styles.assignmentName}>{assignment.title}</span>
                                                            </div>
                                                            
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.batchCell}>
                                                            
                                                            <span>{assignment.batchName}</span>
                                                        </div>
                                                    </td>
                                                    <td>{formatDate(assignment.submission?.submittedAt)}</td>
                                                    <td>
                                                        <span className={`${styles.statusChip} ${reviewComplete ? styles.chipGreen : styles.chipOrange}`}>
                                                            {reviewComplete ? "Reviewed" : "Submitted"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {assignment.submission?.grade !== null && assignment.submission?.grade !== undefined ? (
                                                            <span className={styles.gradeChip}>
                                                                 {assignment.submission.grade} / {assignment.maxMarks}
                                                            </span>
                                                        ) : (
                                                            <span className={styles.mutedText}>Pending</span>
                                                        )}
                                                    </td>
                                                    
                                                    <td>
                                                        <div className={styles.actionCell}>
                                                            <Link href={buildStudentContentViewerHref(assignment.assignmentFileUrl, assignment.title)} className={styles.openBtn}>
                                                                Open Assignment <LinkIcon size={14} />
                                                            </Link>
                                                            {assignment.submission?.fileUrl ? (
                                                                <Link href={buildStudentContentViewerHref(assignment.submission.fileUrl, `${assignment.title} Submission`)} className={styles.secondaryLink}>
                                                                    View Submission <LinkIcon size={14} />
                                                                </Link>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
