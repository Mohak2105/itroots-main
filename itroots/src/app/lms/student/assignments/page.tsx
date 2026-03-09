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
    Warning,
    ClipboardText,
    Calendar,
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
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/lms/login");
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
                        <div className={styles.bannerTitle}>My Assignments</div>
                        <div className={styles.bannerSub}>
                            {pendingList.length} pending | {submittedList.length} submitted
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
                        displayed.map((assignment) => {
                            const submitted = Boolean(assignment.submission);
                            const reviewComplete = assignment.submission?.status === "REVIEWED";
                            const selectedFile = selectedFiles[assignment.id];
                            const isUploading = uploadingId === assignment.id;
                            const uploadedAt = new Date(assignment.uploadedAt);

                            return (
                                <div
                                    key={assignment.id}
                                    className={`${styles.assignmentCard} ${submitted ? styles.cardSubmitted : ""}`}
                                >
                                    <div className={styles.cardLeft}>
                                        <div className={styles.cardIcon}>
                                            {reviewComplete ? (
                                                <CheckCircle size={28} color="#10b981" weight="fill" />
                                            ) : submitted ? (
                                                <HourglassMedium size={28} color="#f59e0b" weight="fill" />
                                            ) : (
                                                <ClipboardText size={28} color="#0881ec" weight="fill" />
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardTop}>
                                            <div>
                                                <span className={styles.coursePill}>{assignment.courseName}</span>
                                                <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
                                            </div>
                                            <div className={`${styles.statusChip} ${reviewComplete ? styles.chipGreen : submitted ? styles.chipOrange : styles.chipBlue}`}>
                                                {reviewComplete ? "Reviewed" : submitted ? "Submitted" : "Pending"}
                                            </div>
                                        </div>

                                        <p className={styles.assignmentDesc}>{assignment.description || "No assignment description provided."}</p>

                                        <div className={styles.cardMeta}>
                                            <span>
                                                <Calendar size={15} /> Posted: <strong>{uploadedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                                            </span>
                                            <span>
                                                <ClipboardText size={15} /> Batch: <strong>{assignment.batchName}</strong>
                                            </span>
                                            {assignment.submission?.grade !== null && assignment.submission?.grade !== undefined ? (
                                                <span className={styles.gradeChip}>
                                                    <Trophy size={15} /> Score: {assignment.submission.grade}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className={styles.linkRow}>
                                            <Link href={buildStudentContentViewerHref(assignment.assignmentFileUrl, assignment.title)} className={styles.openBtn}>
                                                Open Assignment <LinkIcon size={14} />
                                            </Link>
                                            {assignment.submission?.fileUrl ? (
                                                <Link href={buildStudentContentViewerHref(assignment.submission.fileUrl, `${assignment.title} Submission`)} className={styles.secondaryLink}>
                                                    View My Submission <LinkIcon size={14} />
                                                </Link>
                                            ) : null}
                                        </div>

                                        {assignment.submission?.feedback ? (
                                            <div className={styles.feedbackBox}>
                                                <ChatCircleDots size={16} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                                                <strong>Faculty Feedback:</strong> {assignment.submission.feedback}
                                            </div>
                                        ) : null}

                                        {!submitted ? (
                                            <div className={styles.submitPanel}>
                                                <div className={styles.submitArea}>
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
                                                </div>
                                                <textarea
                                                    className={styles.notesInput}
                                                    rows={3}
                                                    placeholder="Add notes for your Faculty (optional)"
                                                    value={notesByAssignment[assignment.id] || ""}
                                                    onChange={(event) => setNotesByAssignment((current) => ({ ...current, [assignment.id]: event.target.value }))}
                                                />
                                                <button
                                                    className={styles.submitBtn}
                                                    onClick={() => void handleSubmit(assignment.id)}
                                                    disabled={isUploading}
                                                    type="button"
                                                >
                                                    {isUploading ? (
                                                        <><HourglassMedium size={16} /> Submitting...</>
                                                    ) : (
                                                        "Submit Assignment"
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.submissionInfo}>
                                                <span><CheckCircle size={15} weight="fill" /> Submitted on {new Date(assignment.submission?.submittedAt || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                <span>{assignment.submission?.status === "REVIEWED" ? "Faculty has reviewed this assignment." : "Waiting for Faculty review."}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
