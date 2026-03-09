"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Trophy, UsersThree, ChartBar, ArrowLineDown } from "@phosphor-icons/react";
import { BATCHES, COURSES, ENROLLMENTS, USERS } from "@/data/lms-data";
import styles from "./grades.module.css";

function seededScore(seed: string, min: number, max: number) {
    const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const range = max - min + 1;
    return min + (hash % range);
}

export default function FacultyGradesPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "Faculty")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user || user.role !== "Faculty") return;

        const FacultyBatches = BATCHES
            .filter((batch) => batch.FacultyId === user.id)
            .map((batch) => ({
                ...batch,
                course: COURSES.find((course) => course.id === batch.courseId),
            }));

        setBatches(FacultyBatches);
        setSelectedBatchId(FacultyBatches[0]?.id || "");
        setLoadingBatches(false);
    }, [user]);

    useEffect(() => {
        if (!selectedBatchId) return;
        setLoadingStudents(true);

        const enriched = ENROLLMENTS
            .filter((enrollment) => enrollment.batchId === selectedBatchId)
            .map((enrollment) => {
                const student = USERS.find((u) => u.id === enrollment.studentId);
                if (!student) return null;
                return {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    assignment1: seededScore(`${student.id}-assignment1`, 60, 99),
                    assignment2: seededScore(`${student.id}-assignment2`, 60, 99),
                    midterm: seededScore(`${student.id}-midterm`, 60, 99),
                    project: seededScore(`${student.id}-project`, 70, 99),
                };
            })
            .filter(Boolean);

        setStudents(enriched);
        setLoadingStudents(false);
    }, [selectedBatchId]);

    if (isLoading || !user) return null;

    const avgScore = students.length
        ? Math.round(students.reduce((s, st) => s + Math.round((st.assignment1 + st.assignment2 + st.midterm + st.project) / 4), 0) / students.length)
        : 0;
    const distinction = students.filter(st => Math.round((st.assignment1 + st.assignment2 + st.midterm + st.project) / 4) >= 85).length;
    const passRate = students.length
        ? Math.round((students.filter(st => Math.round((st.assignment1 + st.assignment2 + st.midterm + st.project) / 4) >= 40).length / students.length) * 100)
        : 0;

    return (
        <LMSShell pageTitle="Grades">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Grades & Results</div>
                        <div className={styles.bannerSub}>View and manage student grades across assignments, midterms and projects.</div>
                    </div>
                    <Trophy size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: "#eff6ff", color: "#0881ec" }}>
                            <UsersThree size={20} weight="duotone" />
                        </div>
                        <div className={styles.summaryValue}>{students.length}</div>
                        <div className={styles.summaryLabel}>Total Students</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: "#f0fdf4", color: "#10b981" }}>
                            <ChartBar size={20} weight="duotone" />
                        </div>
                        <div className={styles.summaryValue}>{avgScore}%</div>
                        <div className={styles.summaryLabel}>Avg. Score</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: "#fef3c7", color: "#d97706" }}>
                            <Trophy size={20} weight="duotone" />
                        </div>
                        <div className={styles.summaryValue}>{distinction}</div>
                        <div className={styles.summaryLabel}>Distinction</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: "#faf5ff", color: "#8b5cf6" }}>
                            <ChartBar size={20} weight="duotone" />
                        </div>
                        <div className={styles.summaryValue}>{passRate}%</div>
                        <div className={styles.summaryLabel}>Pass Rate</div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.selectWrapper}>
                        <label className={styles.selectLabel}>Select Batch</label>
                        <select
                            className={styles.batchSelect}
                            value={selectedBatchId}
                            onChange={e => setSelectedBatchId(e.target.value)}
                            disabled={loadingBatches || batches.length === 0}
                        >
                            {batches.length === 0 && <option>No assigned batches</option>}
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name} — {b.course?.title}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.exportBtn}>
                        <ArrowLineDown size={16} /> Export Grades
                    </button>
                </div>

                {/* Grades Table */}
                <div className={styles.tableContainer}>
                    {loadingStudents ? (
                        <div className={styles.emptyState}>
                            <div className={styles.skeleton} />
                            <div className={styles.skeleton} />
                            <div className={styles.skeleton} />
                        </div>
                    ) : students.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Trophy size={52} color="#cbd5e1" weight="duotone" />
                            <p>Select a batch to view student grades.</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Assignment 1</th>
                                    <th>Assignment 2</th>
                                    <th>Midterm</th>
                                    <th>Project</th>
                                    <th>Average</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => {
                                    const avg = Math.round((student.assignment1 + student.assignment2 + student.midterm + student.project) / 4);
                                    const isPass = avg >= 40;
                                    const isDistinction = avg >= 85;
                                    return (
                                        <tr key={student.id || idx}>
                                            <td>
                                                <div className={styles.studentInfo}>
                                                    <div className={styles.avatar}>
                                                        {student.name?.charAt(0).toUpperCase() || "S"}
                                                    </div>
                                                    <div>
                                                        <span className={styles.name}>{student.name}</span>
                                                        <span className={styles.email}>{student.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className={styles.scoreCell}>{student.assignment1}%</span></td>
                                            <td><span className={styles.scoreCell}>{student.assignment2}%</span></td>
                                            <td><span className={styles.scoreCell}>{student.midterm}%</span></td>
                                            <td><span className={styles.scoreCell}>{student.project}%</span></td>
                                            <td><span style={{ fontWeight: 800, color: avg >= 70 ? "#10b981" : avg >= 40 ? "#d97706" : "#ef4444" }}>{avg}%</span></td>
                                            <td>
                                                {isDistinction ? (
                                                    <span className={`${styles.resultBadge} ${styles.distinction}`}>Distinction</span>
                                                ) : isPass ? (
                                                    <span className={`${styles.resultBadge} ${styles.pass}`}>Pass</span>
                                                ) : (
                                                    <span className={`${styles.resultBadge} ${styles.fail}`}>Fail</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
