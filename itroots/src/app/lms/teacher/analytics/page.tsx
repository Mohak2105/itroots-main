"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { UsersThree, ChartBar } from "@/components/icons/lucide-phosphor";
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
        fetch(ENDPOINTS.Faculty.BATCH_ANALYTICS(selectedBatchId), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && Array.isArray(data.data?.students)) {
                    setStudents(data.data.students);
                } else {
                    setStudents([]);
                }
                setLoadingStudents(false);
            })
            .catch(err => { console.error(err); setLoadingStudents(false); });
    }, [token, selectedBatchId]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Analytics & Reporting">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Student Overview </div>
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
                </div>

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
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => {
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
