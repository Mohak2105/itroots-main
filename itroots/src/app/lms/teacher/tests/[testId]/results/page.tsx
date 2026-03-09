"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChartBar, ArrowLeft, User, IdentificationCard, CalendarBlank, Trophy } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./test-results.module.css";

export default function TestResultsPage() {
    const { testId } = useParams();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchResults = useCallback(async () => {
        if (!token || !testId) return;
        setLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.Faculty.TEST_RESULTS}/${testId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok) setResults(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, testId]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "Faculty")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    if (isLoading || !user) return null;

    const avgScore = results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : 0;
    const maxScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;

    return (
        <LMSShell pageTitle="Exam Performance Analytics">
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={18} /> Batch</button>
                <div className={styles.titleInfo}>
                    <h1>Marks Analysis</h1>
                    <p>Evaluating student competency and assessment engagement metrics.</p>
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statBox}>
                    <ChartBar size={32} color="#0881ec" />
                    <div className={styles.statVal}>
                        <span>{avgScore}%</span>
                        <p>Average Score</p>
                    </div>
                </div>
                <div className={styles.statBox}>
                    <Trophy size={32} color="#f59e0b" />
                    <div className={styles.statVal}>
                        <span>{maxScore}%</span>
                        <p>Highest Score</p>
                    </div>
                </div>
                <div className={styles.statBox}>
                    <User size={32} color="#10b981" />
                    <div className={styles.statVal}>
                        <span>{results.length}</span>
                        <p>Submissions</p>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>STUDENT NAME</th>
                            <th>EMAIL</th>
                            <th>SECURED MARKS</th>
                            <th>TIME TAKEN</th>
                            <th>SUBMISSION DATE</th>
                            <th>COMPETENCY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 ? (
                            <tr><td colSpan={6} className={styles.empty}>No results gathered for this assessment yet.</td></tr>
                        ) : (
                            results.map(res => (
                                <tr key={res.id}>
                                    <td>
                                        <div className={styles.studentCell}>
                                            <div className={styles.avatar}>{res.student?.name?.charAt(0)}</div>
                                            <span>{res.student?.name}</span>
                                        </div>
                                    </td>
                                    <td>{res.student?.email}</td>
                                    <td><strong style={{ color: res.score >= 80 ? '#10b981' : '#f59e0b' }}>{res.score} / 100</strong></td>
                                    <td>{res.completionTime} min</td>
                                    <td>{new Date(res.submittedAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={styles.badge} style={{ background: res.score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: res.score >= 80 ? '#10b981' : '#f59e0b' }}>
                                            {res.score >= 90 ? "Excellent" : res.score >= 80 ? "Proficient" : "Progressing"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </LMSShell>
    );
}
