"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChartBar, ArrowLeft, User, Trophy } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./test-results.module.css";

type TestAnalyticsResponse = {
    test: {
        id: string;
        title: string;
        description?: string | null;
        totalMarks: number;
        durationMinutes: number;
        totalQuestions: number;
        batchId: string;
        batchName: string;
        courseId?: string | null;
        courseName: string;
    };
    summary: {
        totalStudents: number;
        attemptedStudents: number;
        unattemptedStudents: number;
        averageScore: number;
        averagePercentage: number;
        highestScore: number;
        lowestScore: number;
    };
    students: Array<{
        studentId: string;
        studentName: string;
        studentEmail: string;
        attempted: boolean;
        score: number | null;
        percentage: number | null;
        completionTime: number | null;
        submittedAt: string | null;
        progressPercent: number;
        autoSubmitted?: boolean;
        violationReason?: string | null;
    }>;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDuration = (seconds?: number | null) => {
    if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) return "-";
    const safeSeconds = Number(seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};

export default function TestResultsPage() {
    const { testId } = useParams();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<TestAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchResults = useCallback(async () => {
        if (!token || !testId) return;
        setLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.Faculty.TEST_RESULTS}/${testId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok) setAnalytics(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, testId]);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    if (isLoading || !user) return null;

    const summary = analytics?.summary;
    const test = analytics?.test;
    const students = analytics?.students || [];

    return (
        <LMSShell pageTitle="Exam Performance Analytics">
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={18} /> Batch</button>
                <div className={styles.titleInfo}>
                    <h1>{test?.title || "Marks Analysis"}</h1>
                    <p>
                        {test
                            ? `${test.courseName} | ${test.batchName} | ${test.totalQuestions} Questions`
                            : "Evaluating student competency and assessment engagement metrics."}
                    </p>
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statBox}>
                    <ChartBar size={32} color="#0881ec" />
                    <div className={styles.statVal}>
                        <span>{summary ? `${summary.averagePercentage}%` : "0%"}</span>
                        <p>Average %</p>
                    </div>
                </div>
                <div className={styles.statBox}>
                    <Trophy size={32} color="#f59e0b" />
                    <div className={styles.statVal}>
                        <span>{summary ? `${summary.highestScore}/${test?.totalMarks || 0}` : "0"}</span>
                        <p>Highest Marks</p>
                    </div>
                </div>
                <div className={styles.statBox}>
                    <User size={32} color="#10b981" />
                    <div className={styles.statVal}>
                        <span>{summary ? `${summary.attemptedStudents}/${summary.totalStudents}` : "0/0"}</span>
                        <p>Attempts</p>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>STUDENT NAME</th>
                            <th>STATUS</th>
                            <th>SECURED MARKS</th>
                            <th>PROGRESS</th>
                            <th>TIME TAKEN</th>
                            <th>SUBMISSION DATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className={styles.empty}>Loading test analytics...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={6} className={styles.empty}>No enrolled students found for this test batch.</td></tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.studentId}>
                                    <td>
                                        <div className={styles.studentCell}>
                                            <div className={styles.avatar}>{student.studentName?.charAt(0)}</div>
                                            <span>{student.studentName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={student.attempted ? styles.statusDone : styles.statusPending}>
                                            {student.attempted ? "Attempted" : "Not Attempted"}
                                        </span>
                                    </td>
                                    <td>
                                        {student.attempted
                                            ? <strong>{student.score} / {test?.totalMarks || 0}</strong>
                                            : "-"}
                                    </td>
                                    <td>
                                        <div className={styles.progressWrap}>
                                            <div className={styles.progressTrack}>
                                                <div className={styles.progressFill} style={{ width: `${student.progressPercent || 0}%` }} />
                                            </div>
                                            <span className={styles.progressValue}>{student.progressPercent || 0}%</span>
                                        </div>
                                    </td>
                                    <td>{student.attempted ? formatDuration(student.completionTime) : "-"}</td>
                                    <td>{student.attempted ? formatDateTime(student.submittedAt) : "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </LMSShell>
    );
}
