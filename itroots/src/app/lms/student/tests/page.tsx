"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    CheckCircle,
    FileText,
    Timer,
    Question,
    Trophy,
    Confetti,
    ArrowLeft,
    Check,
    Exam,
    WarningCircle,
    ShieldCheck,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./tests.module.css";

type TestQuestion = {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
};

type TestAttempt = {
    id: string;
    score: number;
    percentage?: number;
    correctAnswers?: number;
    wrongAnswers?: number;
    unansweredQuestions?: number;
    autoSubmitted?: boolean;
    violationReason?: string | null;
    completionTime: number;
    submittedAt: string;
};

type StudentTest = {
    id: string;
    title: string;
    description?: string;
    totalMarks: number;
    durationMinutes: number;
    dueAt?: string | null;
    questions: TestQuestion[];
    batchId: string;
    batchName: string;
    courseId?: string | null;
    courseName: string;
    attempt: TestAttempt | null;
};

type SubmissionSummary = {
    score: number;
    totalMarks: number;
    correctAnswers: number;
    totalQuestions: number;
    wrongAnswers: number;
    unansweredQuestions: number;
    percentage: number;
    autoSubmitted: boolean;
    violationReason: string | null;
};

const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getSecondsUntilDue = (value?: string | null) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
    return Math.floor((date.getTime() - Date.now()) / 1000);
};

export default function StudentTestsPage() {
    const { user, isLoading, token, logout } = useLMSAuth();
    const router = useRouter();
    const submitInFlightRef = useRef(false);

    const [tests, setTests] = useState<StudentTest[]>([]);
    const [activeTest, setActiveTest] = useState<StudentTest | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submission, setSubmission] = useState<SubmissionSummary | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [allocatedSeconds, setAllocatedSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    const handleSessionExpired = useCallback(() => {
        logout();
        router.push("/lms/login");
    }, [logout, router]);

    const fetchTests = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(ENDPOINTS.STUDENT.TESTS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => null);

            if (res.status === 401 || json?.message === "Invalid or expired token") {
                handleSessionExpired();
                return;
            }

            if (!res.ok) {
                throw new Error(json?.message || "Unable to fetch tests");
            }
            setTests(Array.isArray(json) ? json : []);
        } catch (error) {
            console.error(error);
        }
    }, [token, handleSessionExpired]);

    useEffect(() => {
        void fetchTests();
    }, [fetchTests]);

    const startTest = (test: StudentTest) => {
        const secondsUntilDue = getSecondsUntilDue(test.dueAt);
        const timeLimitSeconds = test.durationMinutes * 60;
        const nextRemainingSeconds = Math.min(timeLimitSeconds, secondsUntilDue);

        if (nextRemainingSeconds <= 0) {
            alert("This test due time has passed.");
            return;
        }

        setActiveTest(test);
        setAnswers({});
        setSubmission(null);
        setAllocatedSeconds(nextRemainingSeconds);
        setRemainingSeconds(nextRemainingSeconds);
        submitInFlightRef.current = false;
    };

    const exitTest = () => {
        setActiveTest(null);
        setAnswers({});
        setSubmission(null);
        setRemainingSeconds(0);
        setAllocatedSeconds(0);
        setIsSubmitting(false);
        submitInFlightRef.current = false;
    };

    const handleSelect = (questionId: string, optionIndex: number) => {
        if (submission || isSubmitting) return;
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    const submitTest = useCallback(async (forceSubmit = false, violationReason?: string) => {
        if (!activeTest || !token || submitInFlightRef.current) return;

        const totalQuestions = activeTest.questions.length;
        const answered = Object.keys(answers).length;
        const deadlinePassed = getSecondsUntilDue(activeTest.dueAt) <= 0;
        const shouldForceSubmit = forceSubmit || deadlinePassed;
        const normalizedViolationReason = shouldForceSubmit
            ? (violationReason || (deadlinePassed ? "TIME_EXPIRED" : undefined))
            : undefined;

        if (!shouldForceSubmit && answered < totalQuestions) return;

        submitInFlightRef.current = true;
        setIsSubmitting(true);

        try {
            const completionTime = Math.max(allocatedSeconds - remainingSeconds, 0);
            const res = await fetch(ENDPOINTS.STUDENT.SUBMIT_EXAM, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    testId: activeTest.id,
                    answers,
                    completionTime,
                    forceSubmit: shouldForceSubmit,
                    violationReason: normalizedViolationReason,
                }),
            });
            const json = await res.json().catch(() => null);
            if (res.status === 401 || json?.message === "Invalid or expired token") {
                handleSessionExpired();
                return;
            }
            if (!res.ok) {
                throw new Error(json?.message || "Unable to submit test");
            }

            setSubmission(json.summary);
            setTests((prev) => prev.map((test) => (
                test.id === activeTest.id
                    ? {
                        ...test,
                        attempt: {
                            id: json.result.id,
                            score: json.result.score,
                            percentage: json.summary?.percentage,
                            correctAnswers: json.summary?.correctAnswers,
                            wrongAnswers: json.summary?.wrongAnswers,
                            unansweredQuestions: json.summary?.unansweredQuestions,
                            autoSubmitted: json.summary?.autoSubmitted,
                            violationReason: json.summary?.violationReason,
                            completionTime: json.result.completionTime,
                            submittedAt: json.result.submittedAt,
                        },
                    }
                    : test
            )));
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to submit test");
            submitInFlightRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    }, [activeTest, answers, remainingSeconds, allocatedSeconds, token, handleSessionExpired]);

    useEffect(() => {
        if (!activeTest || submission) return;
        const timer = window.setInterval(() => {
            setRemainingSeconds((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    void submitTest(true, "TIME_EXPIRED");
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [activeTest, submission, submitTest]);

    useEffect(() => {
        if (!activeTest || submission) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                void submitTest(true, "TAB_SWITCH");
            }
        };

        const handleWindowBlur = () => {
            void submitTest(true, "WINDOW_BLUR");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [activeTest, submission, submitTest]);

    const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

    if (isLoading || !user) return null;

    if (activeTest) {
        return (
            <LMSShell pageTitle={activeTest.title}>
                <div className={styles.quizContainer}>
                    <div className={styles.quizHeader}>
                        <div>
                            <h2 className={styles.quizTitle}>{activeTest.title}</h2>
                            <p className={styles.quizMeta}>
                                {activeTest.questions.length} Questions | {activeTest.durationMinutes} min | {activeTest.totalMarks} marks
                            </p>
                            {activeTest.dueAt ? <p className={styles.quizDeadline}>Due by {formatDateTime(activeTest.dueAt)}</p> : null}
                            {activeTest.description ? <p className={styles.quizDescription}>{activeTest.description}</p> : null}
                        </div>
                        <div className={styles.quizHeaderSide}>
                            <div className={`${styles.timerChip} ${remainingSeconds <= 60 ? styles.timerDanger : ""}`}>
                                <Timer size={16} /> {formatDuration(remainingSeconds)}
                            </div>
                            {!submission ? (
                                <div className={styles.quizProgress}>{answeredCount}/{activeTest.questions.length} Answered</div>
                            ) : null}
                        </div>
                    </div>

                    {!submission ? (
                        <div className={styles.securityBanner}>
                            <ShieldCheck size={18} />
                            <span>All questions are required. Switching tabs or leaving this window will auto-submit the test.</span>
                        </div>
                    ) : null}

                    {submission ? (
                        <div className={`${styles.resultBanner} ${submission.percentage >= 60 ? styles.resultPass : styles.resultFail}`}>
                            <div className={styles.resultScore}>{submission.score}/{submission.totalMarks}</div>
                            <div className={styles.resultPct}>{submission.percentage}%</div>
                            <div className={styles.resultMsg}>
                                {submission.percentage >= 80 ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Confetti size={24} /> Excellent!
                                    </span>
                                ) : submission.percentage >= 60 ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <CheckCircle size={24} /> Passed!
                                    </span>
                                ) : (
                                    "Better luck next time"
                                )}
                            </div>
                            <div className={styles.resultDetails}>
                                <span>Correct: {submission.correctAnswers}</span>
                                <span>Wrong: {submission.wrongAnswers}</span>
                                <span>Unanswered: {submission.unansweredQuestions}</span>
                            </div>
                            {submission.autoSubmitted ? (
                                <div className={styles.resultNote}>
                                    <WarningCircle size={16} /> Auto-submitted: {submission.violationReason === "TIME_EXPIRED" ? "Time expired" : "tab or window switch detected"}
                                </div>
                            ) : null}
                            <button className={styles.backBtn} onClick={exitTest} type="button">
                                <ArrowLeft size={16} style={{ marginRight: "0.4rem" }} /> Back to Tests
                            </button>
                        </div>
                    ) : null}

                    <div className={styles.questionsList}>
                        {activeTest.questions.map((question, questionIndex) => {
                            const selectedIndex = answers[question.id];
                            const isCorrect = submission && selectedIndex === question.correctIndex;
                            const isWrong = submission && selectedIndex !== undefined && selectedIndex !== question.correctIndex;

                            return (
                                <div
                                    key={question.id}
                                    className={`${styles.questionCard} ${submission ? (isCorrect ? styles.qCorrect : isWrong ? styles.qWrong : styles.qSkipped) : ""}`}
                                >
                                    <div className={styles.questionNum}>Q{questionIndex + 1}</div>
                                    <div className={styles.questionBody}>
                                        <p className={styles.questionText}>{question.text}</p>
                                        <div className={styles.optionsList}>
                                            {question.options.map((option, optionIndex) => {
                                                const isSelected = selectedIndex === optionIndex;
                                                const isCorrectOption = optionIndex === question.correctIndex;
                                                return (
                                                    <button
                                                        key={optionIndex}
                                                        type="button"
                                                        onClick={() => handleSelect(question.id, optionIndex)}
                                                        className={`${styles.optionBtn} ${isSelected && !submission ? styles.optionSelected : ""} ${submission && isCorrectOption ? styles.optionCorrect : ""} ${submission && isSelected && !isCorrectOption ? styles.optionWrong : ""}`}
                                                        disabled={Boolean(submission)}
                                                    >
                                                        <span className={styles.optionLetter}>{["A", "B", "C", "D"][optionIndex]}</span>
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {submission && isWrong ? (
                                            <div className={styles.explanation}>
                                                <Check size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                                                Correct answer: <strong>{question.options[question.correctIndex]}</strong>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!submission ? (
                        <div className={styles.quizSubmitArea}>
                            <button
                                className={styles.submitTestBtn}
                                onClick={() => void submitTest(false)}
                                type="button"
                                disabled={answeredCount < activeTest.questions.length || isSubmitting}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : answeredCount < activeTest.questions.length
                                        ? `Answer All Questions (${activeTest.questions.length - answeredCount} remaining)`
                                        : "Submit Quiz"}
                            </button>
                        </div>
                    ) : null}
                </div>
            </LMSShell>
        );
    }

    return (
        <LMSShell pageTitle="Online Test">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Online Test</div>
                        <div className={styles.bannerSub}>{tests.length} Test{tests.length !== 1 ? "s" : ""} Available across your enrolled batches.</div>
                    </div>
                    <Exam size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.testsList}>
                    {tests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FileText size={52} color="#cbd5e1" weight="duotone" />
                            <h3>No Tests Available</h3>
                            <p>Tests from your enrolled batches will appear here.</p>
                        </div>
                    ) : (
                        tests.map((test) => {
                            const done = Boolean(test.attempt);
                            const isClosed = !done && getSecondsUntilDue(test.dueAt) <= 0;
                            return (
                                <div key={test.id} className={`${styles.testCard} ${done ? styles.testCardDone : ""} ${isClosed ? styles.testCardClosed : ""}`}>
                                    <div className={styles.testCardIcon}>
                                        {done ? <CheckCircle size={28} color="#10b981" weight="fill" /> : <FileText size={28} color="#0881ec" weight="fill" />}
                                    </div>
                                    <div className={styles.testCardBody}>
                                        <span className={styles.testCoursePill}>{test.courseName}</span>
                                        <h3 className={styles.testTitle}>{test.title}</h3>
                                        <div className={styles.testMeta}>
                                            <span><Timer size={14} /> {test.durationMinutes} minutes</span>
                                            <span><Question size={14} /> {test.questions.length} questions</span>
                                            <span><Trophy size={14} /> {test.totalMarks} marks</span>
                                            <span>{test.batchName}</span>
                                            {test.dueAt ? <span className={styles.dueChip}>Due: {formatDateTime(test.dueAt)}</span> : null}
                                            {test.attempt ? (
                                                <span className={styles.scoreChip}>
                                                    Score: {test.attempt.score}/{test.totalMarks}
                                                    {typeof test.attempt.percentage === "number" ? ` (${test.attempt.percentage}%)` : ""}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <button
                                        className={`${styles.startBtn} ${done ? styles.startBtnDone : ""} ${isClosed ? styles.startBtnClosed : ""}`}
                                        onClick={() => !done && !isClosed && startTest(test)}
                                        disabled={done || isClosed}
                                        type="button"
                                    >
                                        {done ? "Completed" : isClosed ? "Closed" : "Start Quiz"}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
