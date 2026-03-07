"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { getEnrollmentsForStudent, getTestsForCourse, getTestAttemptsForStudent, getCourseById, type Test } from "@/data/lms-data";
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
} from "@phosphor-icons/react";
import styles from "./tests.module.css";

export default function StudentTestsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();

    const [activeTest, setActiveTest] = useState<Test | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [doneTestIds, setDoneTestIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/lms/login");
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const enrollments = getEnrollmentsForStudent(user.id);
    const attempts = getTestAttemptsForStudent(user.id);

    const tests = enrollments.flatMap((e) => {
        const course = getCourseById(e.courseId);
        return getTestsForCourse(e.courseId).map((t) => ({
            ...t,
            courseName: course?.title ?? "",
        }));
    }).filter((t, i, self) => self.findIndex((x) => x.id === t.id) === i);

    function startTest(test: Test) {
        setActiveTest(test);
        setAnswers({});
        setSubmitted(false);
        setScore(0);
    }

    function handleSelect(qId: string, idx: number) {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [qId]: idx }));
    }

    function submitTest() {
        if (!activeTest) return;
        let correct = 0;
        activeTest.questions.forEach((q) => {
            if (answers[q.id] === q.correctIndex) correct++;
        });
        setScore(correct);
        setSubmitted(true);
        setDoneTestIds((prev) => [...prev, activeTest.id]);
    }

    // ── Quiz mode ──────────────────────────────────────────
    if (activeTest) {
        const totalQ = activeTest.questions.length;
        const answered = Object.keys(answers).length;
        const pct = submitted ? Math.round((score / totalQ) * 100) : 0;

        return (
            <LMSShell pageTitle={activeTest.title}>
                <div className={styles.quizContainer}>
                    {/* Quiz Header */}
                    <div className={styles.quizHeader}>
                        <div>
                            <h2 className={styles.quizTitle}>{activeTest.title}</h2>
                            <p className={styles.quizMeta}>
                                {totalQ} Questions · {activeTest.durationMinutes} min · {activeTest.totalMarks} marks
                            </p>
                        </div>
                        {!submitted && (
                            <div className={styles.quizProgress}>
                                {answered}/{totalQ} Answered
                            </div>
                        )}
                    </div>

                    {/* Result Banner */}
                    {submitted && (
                        <div className={`${styles.resultBanner} ${pct >= 60 ? styles.resultPass : styles.resultFail}`}>
                            <div className={styles.resultScore}>{score}/{totalQ}</div>
                            <div className={styles.resultPct}>{pct}%</div>
                            <div className={styles.resultMsg}>
                                {pct >= 80 ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Confetti size={24} /> Excellent!
                                    </span>
                                ) : pct >= 60 ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <CheckCircle size={24} /> Passed!
                                    </span>
                                ) : (
                                    "Better luck next time"
                                )}
                            </div>
                            <button className={styles.backBtn} onClick={() => setActiveTest(null)} type="button">
                                <ArrowLeft size={16} style={{ marginRight: "0.4rem" }} /> Back to Tests
                            </button>
                        </div>
                    )}

                    {/* Questions */}
                    <div className={styles.questionsList}>
                        {activeTest.questions.map((q, qi) => {
                            const selectedIdx = answers[q.id];
                            const isCorrect = submitted && selectedIdx === q.correctIndex;
                            const isWrong = submitted && selectedIdx !== undefined && !isCorrect;

                            return (
                                <div
                                    key={q.id}
                                    className={`${styles.questionCard} ${submitted ? (isCorrect ? styles.qCorrect : isWrong ? styles.qWrong : styles.qSkipped) : ""}`}
                                >
                                    <div className={styles.questionNum}>Q{qi + 1}</div>
                                    <div className={styles.questionBody}>
                                        <p className={styles.questionText}>{q.text}</p>
                                        <div className={styles.optionsList}>
                                            {q.options.map((opt, oi) => {
                                                const isSelected = selectedIdx === oi;
                                                const isCorrectOpt = oi === q.correctIndex;
                                                return (
                                                    <button
                                                        key={oi}
                                                        type="button"
                                                        onClick={() => handleSelect(q.id, oi)}
                                                        className={`${styles.optionBtn} ${isSelected && !submitted ? styles.optionSelected : ""} ${submitted && isCorrectOpt ? styles.optionCorrect : ""} ${submitted && isSelected && !isCorrectOpt ? styles.optionWrong : ""}`}
                                                    >
                                                        <span className={styles.optionLetter}>{["A", "B", "C", "D"][oi]}</span>
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {submitted && isWrong && (
                                            <div className={styles.explanation}>
                                                <Check size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                                                Correct answer: <strong>{q.options[q.correctIndex]}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit */}
                    {!submitted && (
                        <div className={styles.quizSubmitArea}>
                            <button
                                className={styles.submitTestBtn}
                                onClick={submitTest}
                                type="button"
                                disabled={answered < totalQ}
                            >
                                {answered < totalQ ? `Answer All Questions (${totalQ - answered} remaining)` : "Submit Quiz"}
                            </button>
                        </div>
                    )}
                </div>
            </LMSShell>
        );
    }

    // ── Test listing ────────────────────────────────────────
    return (
        <LMSShell pageTitle="Tests & Quizzes">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Tests & Quizzes</div>
                        <div className={styles.bannerSub}>{tests.length} test{tests.length !== 1 ? "s" : ""} available across your enrolled batches.</div>
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
                        tests.map((t) => {
                            const attempt = attempts.find((a) => a.testId === t.id);
                            const justCompleted = doneTestIds.includes(t.id);
                            const done = !!attempt || justCompleted;

                            return (
                                <div key={t.id} className={`${styles.testCard} ${done ? styles.testCardDone : ""}`}>
                                    <div className={styles.testCardIcon}>
                                        {done ? <CheckCircle size={28} color="#10b981" weight="fill" /> : <FileText size={28} color="#0881ec" weight="fill" />}
                                    </div>
                                    <div className={styles.testCardBody}>
                                        <span className={styles.testCoursePill}>{t.courseName}</span>
                                        <h3 className={styles.testTitle}>{t.title}</h3>
                                        <div className={styles.testMeta}>
                                            <span><Timer size={14} /> {t.durationMinutes} minutes</span>
                                            <span><Question size={14} /> {t.questions.length} questions</span>
                                            <span><Trophy size={14} /> {t.totalMarks} marks</span>
                                            {attempt && (
                                                <span className={styles.scoreChip}>Score: {attempt.score}/{t.questions.length}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className={`${styles.startBtn} ${done ? styles.startBtnDone : ""}`}
                                        onClick={() => !done && startTest(t)}
                                        disabled={done}
                                        type="button"
                                    >
                                        {done ? "Completed ✓" : "Start Quiz →"}
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
