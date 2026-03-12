"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { API_BASE_URL, ENDPOINTS } from "@/config/api";
import { ClipboardText, CheckCircle, DownloadSimple } from "@phosphor-icons/react";
import styles from "./teacher-assignments.module.css";

type Submission = {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    fileUrl: string;
    fileName: string;
    notes?: string;
    status: "SUBMITTED" | "REVIEWED";
    grade?: number | null;
    feedback?: string | null;
    submittedAt: string;
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
    submissionStats: {
        total: number;
        pending: number;
        reviewed: number;
    };
    submissions: Submission[];
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

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

export default function FacultyAssignmentsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [gradeBySubmission, setGradeBySubmission] = useState<Record<string, string>>({});
    const [feedbackBySubmission, setFeedbackBySubmission] = useState<Record<string, string>>({});
    const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    const fetchAssignments = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const response = await fetch(ENDPOINTS.Faculty.ASSIGNMENTS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setAssignments(list);

            const nextGrades: Record<string, string> = {};
            const nextFeedback: Record<string, string> = {};
            list.forEach((assignment: AssignmentRecord) => {
                assignment.submissions.forEach((submission) => {
                    nextGrades[submission.id] = submission.grade === null || submission.grade === undefined ? "" : String(submission.grade);
                    nextFeedback[submission.id] = submission.feedback || "";
                });
            });
            setGradeBySubmission(nextGrades);
            setFeedbackBySubmission(nextFeedback);
        } catch (error) {
            console.error("Failed to fetch Faculty assignments:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchAssignments();
        }
    }, [token]);

    const totals = useMemo(() => assignments.reduce((summary, assignment) => ({
        assignments: summary.assignments + 1,
        submissions: summary.submissions + assignment.submissionStats.total,
        pending: summary.pending + assignment.submissionStats.pending,
        reviewed: summary.reviewed + assignment.submissionStats.reviewed,
    }), { assignments: 0, submissions: 0, pending: 0, reviewed: 0 }), [assignments]);

    const handleReview = async (submissionId: string) => {
        if (!token) return;
        setSavingSubmissionId(submissionId);
        try {
            const response = await fetch(ENDPOINTS.Faculty.REVIEW_ASSIGNMENT(submissionId), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    grade: gradeBySubmission[submissionId],
                    feedback: feedbackBySubmission[submissionId],
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Unable to save review");
            }
            await fetchAssignments();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to save review");
        } finally {
            setSavingSubmissionId(null);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Assignments">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Assignments Review</div>
                        <div className={styles.bannerSub}>Review student submissions, add marks, and return feedback from one place.</div>
                    </div>
                    <ClipboardText size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}><span className={styles.statValue}>{totals.assignments}</span><span className={styles.statLabel}>Assignments</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{totals.submissions}</span><span className={styles.statLabel}>Submissions</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{totals.pending}</span><span className={styles.statLabel}>Pending Review</span></div>
                    <div className={styles.statCard}><span className={styles.statValue}>{totals.reviewed}</span><span className={styles.statLabel}>Reviewed</span></div>
                </div>

                {loadingData ? (
                    <div className={styles.emptyState}>Loading assignments...</div>
                ) : assignments.length === 0 ? (
                    <div className={styles.emptyState}>No assignments uploaded for your batches yet.</div>
                ) : (
                    <div className={styles.assignmentList}>
                        {assignments.map((assignment) => (
                            <section key={assignment.id} className={styles.assignmentCard}>
                                <div className={styles.assignmentHeader}>
                                    <div>
                                        <div className={styles.assignmentMeta}>{assignment.courseName} | {assignment.batchName}</div>
                                        <h3>{assignment.title}</h3>
                                        <p>{assignment.description || "No assignment description provided."}</p>
                                    </div>
                                    <div className={styles.badgeRow}>
                                        <span className={styles.badgeBlue}>{assignment.submissionStats.total} Submitted</span>
                                        <span className={styles.badgeAmber}>{assignment.submissionStats.pending} Pending</span>
                                        <span className={styles.badgeGreen}>{assignment.submissionStats.reviewed} Reviewed</span>
                                    </div>
                                </div>

                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Submission</th>
                                                <th>Notes</th>
                                                <th>Status</th>
                                                <th>Grade</th>
                                                <th>Feedback</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignment.submissions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className={styles.emptyCell}>No student submissions yet.</td>
                                                </tr>
                                            ) : assignment.submissions.map((submission) => (
                                                <tr key={submission.id}>
                                                    <td>
                                                        <div className={styles.tableStack}>
                                                            <div className={styles.tablePrimary}>{submission.studentName}</div>
                                                            <div className={styles.tableSecondary}>{submission.studentEmail}</div>
                                                            <div className={styles.tableMuted}>Submitted on {formatDate(submission.submittedAt)}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <a href={resolveFileUrl(submission.fileUrl)} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                                            {submission.fileName} <DownloadSimple size={14} />
                                                        </a>
                                                    </td>
                                                    <td>{submission.notes || "-"}</td>
                                                    <td>
                                                        <span className={submission.status === "REVIEWED" ? styles.reviewedBadge : styles.pendingBadge}>
                                                            {submission.status === "REVIEWED" ? <CheckCircle size={14} weight="fill" /> : null}
                                                            {submission.status === "REVIEWED" ? "Reviewed" : "Submitted"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={gradeBySubmission[submission.id] || ""}
                                                            onChange={(event) => setGradeBySubmission((current) => ({ ...current, [submission.id]: event.target.value }))}
                                                            className={styles.gradeInput}
                                                            placeholder="Marks"
                                                        />
                                                    </td>
                                                    <td>
                                                        <textarea
                                                            rows={2}
                                                            value={feedbackBySubmission[submission.id] || ""}
                                                            onChange={(event) => setFeedbackBySubmission((current) => ({ ...current, [submission.id]: event.target.value }))}
                                                            className={styles.feedbackInput}
                                                            placeholder="Add feedback for the student"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={styles.saveBtn}
                                                            onClick={() => void handleReview(submission.id)}
                                                            disabled={savingSubmissionId === submission.id}
                                                        >
                                                            {savingSubmissionId === submission.id ? "Saving..." : "Save Review"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}


