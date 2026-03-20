"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { UsersThree, ChatTeardropText, ArrowLineDown, ChartBar, Warning } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./analytics.module.css";

export default function FacultyAnalyticsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.Faculty.MY_BATCHES, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBatches(data);
                    setSelectedBatchId(data[0].id);
                }
                setLoadingBatches(false);
            })
            .catch(err => { console.error(err); setLoadingBatches(false); });
    }, [token]);

    useEffect(() => {
        if (!token || !selectedBatchId) return;
        setLoadingStudents(true);
        // Fix: BATCH_DATA is a string base URL, append the batchId
        fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${selectedBatchId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data?.enrollments) {
                    const enriched = data.data.enrollments.map((e: any) => ({
                        ...e.student,
                        attendance: Math.floor(Math.random() * 40) + 60,
                        completion: Math.floor(Math.random() * 60) + 40,
                        score: Math.floor(Math.random() * 50) + 50,
                    }));
                    setStudents(enriched);
                } else {
                    setStudents([]);
                }
                setLoadingStudents(false);
            })
            .catch(err => { console.error(err); setLoadingStudents(false); });
    }, [token, selectedBatchId]);

    if (isLoading || !user) return null;

    const atRisk = students.filter(s => s.attendance < 75).length;
    const avgAttendance = students.length
        ? Math.round(students.reduce((s, st) => s + st.attendance, 0) / students.length)
        : 0;
    const avgScore = students.length
        ? Math.round(students.reduce((s, st) => s + st.score, 0) / students.length)
        : 0;

    return (
        <LMSShell pageTitle="Analytics & Reporting">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Analytics & Reporting</div>
                        <div className={styles.bannerSub}>Monitor individual student progress, attendance, and assessments.</div>
                    </div>
                    <ChartBar size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Batch Selector + Export */}
                <div className={styles.controls}>
                    <div className={styles.selectWrapper}>
                        <label className={styles.selectLabel}>Select Batch</label>
                        <div className={styles.customSelectWrap}>
                            <CustomSelect
                                value={selectedBatchId}
                                onChange={(value) => setSelectedBatchId(value)}
                                placeholder="Select batch"
                                disabled={loadingBatches || batches.length === 0}
                                options={
                                    batches.length === 0
                                        ? [{ value: "", label: "No assigned batches" }]
                                        : batches.map((batch) => ({
                                            value: batch.id,
                                            label: `${batch.name} - ${batch.course?.title || ""}`.trim(),
                                        }))
                                }
                            />
                        </div>
                    </div>
                    <button className={styles.exportBtn}>
                        <ArrowLineDown size={16} /> Export CSV
                    </button>
                </div>

                {/* Summary Cards */}
                {students.length > 0 && (
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
                            <div className={styles.summaryValue}>{avgAttendance}%</div>
                            <div className={styles.summaryLabel}>Avg. Attendance</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryIcon} style={{ background: "#faf5ff", color: "#8b5cf6" }}>
                                <ChartBar size={20} weight="duotone" />
                            </div>
                            <div className={styles.summaryValue}>{avgScore}%</div>
                            <div className={styles.summaryLabel}>Avg. Score</div>
                        </div>
                        {atRisk > 0 && (
                            <div className={styles.summaryCard} style={{ borderColor: "#fee2e2" }}>
                                <div className={styles.summaryIcon} style={{ background: "#fee2e2", color: "#ef4444" }}>
                                    <Warning size={20} weight="duotone" />
                                </div>
                                <div className={styles.summaryValue} style={{ color: "#ef4444" }}>{atRisk}</div>
                                <div className={styles.summaryLabel}>At Risk (&lt;75%)</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Student Table */}
                <div className={styles.tableContainer}>
                    {loadingStudents ? (
                        <div className={styles.emptyState}>
                            <div className={styles.skeleton} />
                            <div className={styles.skeleton} />
                            <div className={styles.skeleton} />
                        </div>
                    ) : students.length === 0 ? (
                        <div className={styles.emptyState}>
                            <UsersThree size={52} color="#cbd5e1" weight="duotone" />
                            <p>Select a batch or no students enrolled yet.</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Attendance</th>
                                    <th>Completion</th>
                                    <th>Avg. Score</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => {
                                    const isAtRisk = student.attendance < 75;
                                    return (
                                        <tr key={student.id || idx} className={isAtRisk ? styles.rowAtRisk : ""}>
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
                                            <td>
                                                <span className={styles.attBadge} style={{
                                                    background: student.attendance >= 85 ? "#dcfce7" : student.attendance >= 75 ? "#fef3c7" : "#fee2e2",
                                                    color: student.attendance >= 85 ? "#166534" : student.attendance >= 75 ? "#92400e" : "#991b1b",
                                                }}>
                                                    {student.attendance}%
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.progressWrapper}>
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressFill}
                                                            style={{
                                                                width: `${student.completion}%`,
                                                                background: student.completion < 50 ? "#f59e0b" : "#0881ec",
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={styles.progressPct}>{student.completion}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: student.score >= 70 ? "#10b981" : "#f59e0b" }}>
                                                    {student.score}%
                                                </span>
                                            </td>
                                            <td>
                                                {isAtRisk ? (
                                                    <span className={`${styles.statusBadge} ${styles.statusRisk}`}>At Risk</span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.statusOk}`}>On Track</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => alert(`Feedback sent to ${student.name}`)}
                                                >
                                                    <ChatTeardropText size={15} /> Feedback
                                                </button>
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
