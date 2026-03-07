"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    getEnrollmentsForStudent,
    getAssignmentsForCourse,
    getSubmissionsForStudent,
    getCourseById,
    type Assignment,
} from "@/data/lms-data";
import {
    CheckCircle,
    Warning,
    ClipboardText,
    Calendar,
    Trophy,
    ChatCircleDots,
    Paperclip,
    HourglassMedium,
} from "@phosphor-icons/react";
import styles from "./assignments.module.css";

export default function StudentAssignmentsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const [submittedIds, setSubmittedIds] = useState<string[]>([]);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/lms/login");
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const enrollments = getEnrollmentsForStudent(user.id);
    const mySubmissions = getSubmissionsForStudent(user.id);
    const alreadySubmitted = mySubmissions.map((s) => s.assignmentId);

    const assignments = enrollments
        .flatMap((e) => {
            const course = getCourseById(e.courseId);
            return getAssignmentsForCourse(e.courseId).map((a) => ({
                ...a,
                courseName: course?.title ?? "Unknown Course",
            }));
        })
        .filter((a, i, self) => self.findIndex((x) => x.id === a.id) === i)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const isPending = (id: string) => !alreadySubmitted.includes(id) && !submittedIds.includes(id);
    const isSubmitted = (id: string) => alreadySubmitted.includes(id) || submittedIds.includes(id);
    const submission = (id: string) => mySubmissions.find((s) => s.assignmentId === id);

    const pendingList = assignments.filter(a => isPending(a.id));
    const submittedList = assignments.filter(a => isSubmitted(a.id));
    const displayed = activeTab === "pending" ? pendingList : submittedList;

    async function handleSubmit(assignment: Assignment & { courseName: string }) {
        setUploadingId(assignment.id);
        await new Promise((r) => setTimeout(r, 1200));
        setSubmittedIds((prev) => [...prev, assignment.id]);
        setUploadingId(null);
    }

    return (
        <LMSShell pageTitle="Assignments">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>My Assignments</div>
                        <div className={styles.bannerSub}>
                            {pendingList.length} pending · {submittedList.length} submitted
                        </div>
                    </div>
                    <ClipboardText size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "pending" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("pending")}
                    >
                        Pending <span className={styles.tabCount}>{pendingList.length}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "submitted" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("submitted")}
                    >
                        Submitted <span className={styles.tabCount}>{submittedList.length}</span>
                    </button>
                </div>

                {/* List */}
                <div className={styles.assignmentsList}>
                    {displayed.length === 0 ? (
                        <div className={styles.emptyState}>
                            <ClipboardText size={52} color="#cbd5e1" weight="duotone" />
                            <h3>{activeTab === "pending" ? "No Pending Assignments" : "No Submitted Assignments"}</h3>
                            <p>{activeTab === "pending" ? "Great job! You're all caught up." : "Submit your pending assignments to see them here."}</p>
                        </div>
                    ) : (
                        displayed.map((a) => {
                            const submitted = isSubmitted(a.id);
                            const sub = submission(a.id);
                            const isUploading = uploadingId === a.id;
                            const dueDate = new Date(a.dueDate);
                            const isOverdue = !submitted && dueDate < new Date();

                            return (
                                <div
                                    key={a.id}
                                    className={`${styles.assignmentCard} ${submitted ? styles.cardSubmitted : isOverdue ? styles.cardOverdue : ""}`}
                                >
                                    <div className={styles.cardLeft}>
                                        <div className={styles.cardIcon}>
                                            {submitted ? (
                                                <CheckCircle size={28} color="#10b981" weight="fill" />
                                            ) : isOverdue ? (
                                                <Warning size={28} color="#ef4444" weight="fill" />
                                            ) : (
                                                <ClipboardText size={28} color="#f59e0b" weight="fill" />
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardTop}>
                                            <div>
                                                <span className={styles.coursePill}>{a.courseName}</span>
                                                <h3 className={styles.assignmentTitle}>{a.title}</h3>
                                            </div>
                                            <div className={`${styles.statusChip} ${submitted ? styles.chipGreen : isOverdue ? styles.chipRed : styles.chipOrange}`}>
                                                {submitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                                            </div>
                                        </div>

                                        <p className={styles.assignmentDesc}>{a.description}</p>

                                        <div className={styles.cardMeta}>
                                            <span>
                                                <Calendar size={15} /> Due: <strong>{dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                                            </span>
                                            <span>
                                                <Trophy size={15} /> Max: <strong>{a.maxMarks} marks</strong>
                                            </span>
                                            {sub?.grade !== undefined && (
                                                <span className={styles.gradeChip}>
                                                    Score: {sub.grade}/{a.maxMarks}
                                                </span>
                                            )}
                                        </div>

                                        {sub?.feedback && (
                                            <div className={styles.feedbackBox}>
                                                <ChatCircleDots size={16} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                                                <strong>Teacher Feedback:</strong> {sub.feedback}
                                            </div>
                                        )}

                                        {!submitted && (
                                            <div className={styles.submitArea}>
                                                <label className={styles.fileLabel} htmlFor={`file-${a.id}`}>
                                                    <Paperclip size={16} /> Choose File
                                                    <input
                                                        type="file"
                                                        id={`file-${a.id}`}
                                                        className={styles.fileInput}
                                                        accept=".pdf,.py,.java,.zip,.docx"
                                                    />
                                                </label>
                                                <button
                                                    className={styles.submitBtn}
                                                    onClick={() => handleSubmit(a)}
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
