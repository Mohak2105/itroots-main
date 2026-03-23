"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import {
    ArrowLeft,
    CheckCircle,
    ClipboardText,
    DownloadSimple,
    Eye,
    Spinner,
    WarningCircle,
    X,
} from "@/components/icons/lucide-phosphor";
import styles from "./assignment-detail.module.css";

type AssignmentSubmissionRow = {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    fileUrl?: string;
    fileName?: string;
    notes?: string;
    status: "SUBMITTED" | "REVIEWED";
    grade?: number | null;
    feedback?: string | null;
    submittedAt: string;
};

type AssignmentPendingRow = {
    studentId: string;
    studentName: string;
    studentEmail: string;
    enrollmentStatus: string;
};

type AssignmentDetail = {
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
    submittedStudents: AssignmentSubmissionRow[];
    unsubmittedStudents: AssignmentPendingRow[];
};

const resolveFileUrl = (value?: string) => {
    const url = String(value || "").trim();
    if (!url) return "#";
    try {
        return new URL(url).toString();
    } catch {
        return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
    }
};

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export default function TeacherAssignmentDetailPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const params = useParams();
    const assignmentId = String(params?.assignmentId || "");

    const [detail, setDetail] = useState<AssignmentDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"submitted" | "unsubmitted">("submitted");
    const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmissionRow | null>(null);
    const [grade, setGrade] = useState("");
    const [feedback, setFeedback] = useState("");
    const [savingReview, setSavingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    const fetchDetail = async () => {
        if (!token || !assignmentId) return;
        setLoadingDetail(true);
        try {
            const response = await fetch(ENDPOINTS.Faculty.ASSIGNMENT_DETAIL(assignmentId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Unable to load assignment");
            }

            setDetail(data);
            setPageMessage(null);
        } catch (error) {
            console.error(error);
            setDetail(null);
            setPageMessage(error instanceof Error ? error.message : "Unable to load assignment");
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (token && assignmentId) {
            void fetchDetail();
        }
    }, [token, assignmentId]);

    const submittedRows = detail?.submittedStudents || [];
    const unsubmittedRows = detail?.unsubmittedStudents || [];
    const displayedRows = activeTab === "submitted" ? submittedRows : unsubmittedRows;

    const summaryCards = useMemo(() => {
        if (!detail) return [];
        return [
            { label: "Submitted", value: detail.submissionStats.totalSubmitted },
            { label: "Unsubmitted", value: detail.submissionStats.unsubmitted },
            { label: "Pending Review", value: detail.submissionStats.pendingReview },
            { label: "Reviewed", value: detail.submissionStats.reviewed },
        ];
    }, [detail]);

    const openReviewModal = (submission: AssignmentSubmissionRow) => {
        setSelectedSubmission(submission);
        setGrade(submission.grade !== null && submission.grade !== undefined ? String(submission.grade) : "");
        setFeedback(submission.feedback || "");
        setReviewError(null);
    };

    const closeReviewModal = () => {
        setSelectedSubmission(null);
        setGrade("");
        setFeedback("");
        setReviewError(null);
        setSavingReview(false);
    };

    const handleReviewSave = async (event: FormEvent) => {
        event.preventDefault();
        if (!token || !selectedSubmission || !detail) return;

        setSavingReview(true);
        setReviewError(null);
        try {
            const response = await fetch(ENDPOINTS.Faculty.REVIEW_ASSIGNMENT(selectedSubmission.id), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grade: grade.trim() === "" ? null : Number(grade),
                    feedback,
                }),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Unable to save review");
            }

            closeReviewModal();
            setPageMessage("Assignment submission reviewed successfully.");
            await fetchDetail();
        } catch (error) {
            console.error(error);
            setReviewError(error instanceof Error ? error.message : "Unable to save review");
        } finally {
            setSavingReview(false);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Assignment Review">
            <div className={styles.page}>
                <div className={styles.backRow}>
                    <button type="button" className={styles.backBtn} onClick={() => router.push("/faculty/assignments")}>
                        <ArrowLeft size={16} /> Back to Assignments
                    </button>
                </div>

                {loadingDetail ? (
                    <div className={styles.emptyState}>Loading assignment details...</div>
                ) : !detail ? (
                    <div className={styles.emptyState}>
                        <WarningCircle size={42} weight="duotone" color="#cbd5e1" />
                        <div>{pageMessage || "Assignment detail is unavailable."}</div>
                    </div>
                ) : (
                    <>
                        <div className={styles.headerCard}>
                            <div className={styles.headerMeta}>
                                <span className={styles.headerChip}>{detail.courseName}</span>
                                <h1>{detail.title}</h1>
                                <p>{detail.description || "Review submitted work, track missing students, and grade with feedback from one place."}</p>
                                <div className={styles.headerFacts}>
                                    <span>Batch: <strong>{detail.batchName}</strong></span>
                                    <span>Max Marks: <strong>{detail.maxMarks}</strong></span>
                                    <span>Uploaded: <strong>{formatDateTime(detail.createdAt)}</strong></span>
                                </div>
                            </div>
                            <div className={styles.headerActions}>
                                <a
                                    href={resolveFileUrl(detail.contentUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.primaryLink}
                                >
                                    <Eye size={15} /> View Assignment
                                </a>
                            </div>
                        </div>

                        <div className={styles.summaryGrid}>
                            {summaryCards.map((card) => (
                                <div key={card.label} className={styles.summaryCard}>
                                    <span className={styles.summaryValue}>{card.value}</span>
                                    <span className={styles.summaryLabel}>{card.label}</span>
                                </div>
                            ))}
                        </div>

                        {pageMessage ? (
                            <div className={styles.noticeBar}>
                                <CheckCircle size={18} weight="fill" />
                                <span>{pageMessage}</span>
                            </div>
                        ) : null}

                        <div className={styles.tableCard}>
                            <div className={styles.tableHeader}>
                                <div className={styles.tabs}>
                                    <button
                                        type="button"
                                        className={`${styles.tab} ${activeTab === "submitted" ? styles.tabActive : ""}`}
                                        onClick={() => setActiveTab("submitted")}
                                    >
                                        Submitted <span>{detail.submissionStats.totalSubmitted}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.tab} ${activeTab === "unsubmitted" ? styles.tabActive : ""}`}
                                        onClick={() => setActiveTab("unsubmitted")}
                                    >
                                        Unsubmitted <span>{detail.submissionStats.unsubmitted}</span>
                                    </button>
                                </div>
                                <div className={styles.tableHint}>
                                    {activeTab === "submitted"
                                        ? "Review and mark student submissions."
                                        : "Active enrolled students who have not submitted yet."}
                                </div>
                            </div>

                            {displayedRows.length === 0 ? (
                                <div className={styles.tableEmpty}>
                                    <ClipboardText size={42} color="#cbd5e1" weight="duotone" />
                                    <div>
                                        {activeTab === "submitted"
                                            ? "No submissions yet for this assignment."
                                            : "All active students have submitted this assignment."}
                                    </div>
                                </div>
                            ) : activeTab === "submitted" ? (
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Email</th>
                                                <th>Submitted At</th>
                                                <th>Submission File</th>
                                                <th>Status</th>
                                                <th>Score</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {submittedRows.map((submission) => (
                                                <tr key={submission.id}>
                                                    <td>{submission.studentName}</td>
                                                    <td>{submission.studentEmail || "-"}</td>
                                                    <td>{formatDateTime(submission.submittedAt)}</td>
                                                    <td>
                                                        {submission.fileUrl ? (
                                                            <a href={resolveFileUrl(submission.fileUrl)} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                                                                <DownloadSimple size={14} /> {submission.fileName || "View Submission"}
                                                            </a>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${submission.status === "REVIEWED" ? styles.badgeReviewed : styles.badgePending}`}>
                                                            {submission.status === "REVIEWED" ? "Reviewed" : "Pending"}
                                                        </span>
                                                    </td>
                                                    <td>{submission.grade !== null && submission.grade !== undefined ? `${submission.grade} / ${detail.maxMarks}` : "-"}</td>
                                                    <td>
                                                        <button type="button" className={styles.actionBtn} onClick={() => openReviewModal(submission)}>
                                                            {submission.status === "REVIEWED" ? "Update Review" : "Review"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Email</th>
                                                <th>Enrollment Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unsubmittedRows.map((student) => (
                                                <tr key={student.studentId}>
                                                    <td>{student.studentName}</td>
                                                    <td>{student.studentEmail || "-"}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${styles.badgeActive}`}>{student.enrollmentStatus}</span>
                                                    </td>
                                                    <td>
                                                        <span className={styles.pendingText}>Waiting for submission</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {selectedSubmission && detail ? (
                <div className={styles.overlay} onClick={closeReviewModal}>
                    <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <div className={styles.modalTitle}>Review Submission</div>
                                <div className={styles.modalSub}>
                                    {selectedSubmission.studentName} • {detail.title}
                                </div>
                            </div>
                            <button type="button" className={styles.closeBtn} onClick={closeReviewModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalLinks}>
                            <a href={resolveFileUrl(detail.contentUrl)} target="_blank" rel="noreferrer" className={styles.resourceLink}>
                                <Eye size={15} /> View Assignment
                            </a>
                            {selectedSubmission.fileUrl ? (
                                <a href={resolveFileUrl(selectedSubmission.fileUrl)} target="_blank" rel="noreferrer" className={styles.resourceLink}>
                                    <DownloadSimple size={15} /> View Submission
                                </a>
                            ) : null}
                        </div>

                        {selectedSubmission.notes ? (
                            <div className={styles.notesBox}>
                                <strong>Student Notes:</strong> {selectedSubmission.notes}
                            </div>
                        ) : null}

                        <form className={styles.reviewForm} onSubmit={handleReviewSave}>
                            {reviewError ? <div className={styles.reviewError}>{reviewError}</div> : null}

                            <div className={styles.reviewGrid}>
                                <div>
                                    <label className={styles.fieldLabel}>Score</label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        min={0}
                                        max={detail.maxMarks}
                                        step={1}
                                        value={grade}
                                        onChange={(event) => setGrade(event.target.value)}
                                        placeholder={`0 - ${detail.maxMarks}`}
                                    />
                                </div>
                                <div>
                                    <label className={styles.fieldLabel}>Max Marks</label>
                                    <div className={styles.maxMarksBox}>{detail.maxMarks}</div>
                                </div>
                            </div>

                            <div>
                                <label className={styles.fieldLabel}>Feedback</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={5}
                                    value={feedback}
                                    onChange={(event) => setFeedback(event.target.value)}
                                    placeholder="Add feedback for the student..."
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeReviewModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={savingReview}>
                                    {savingReview ? (
                                        <>
                                            <Spinner size={16} className={styles.spinner} /> Saving...
                                        </>
                                    ) : (
                                        "Save Review"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
