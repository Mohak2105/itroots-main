"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { UsersThree, ChartBar, MagnifyingGlass } from "@/components/icons/lucide-phosphor";
import { BATCHES, COURSES, ENROLLMENTS, USERS } from "@/data/lms-data";
import styles from "./students.module.css";

function seededScore(seed: string, min: number, max: number) {
    const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const range = max - min + 1;
    return min + (hash % range);
}

export default function FacultytudentsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user || user?.role?.toUpperCase() !== "FACULTY") return;

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
                const statusSeed = seededScore(`${student.id}-status`, 0, 4);
                return {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    attendance: seededScore(`${student.id}-attendance`, 60, 99),
                    progress: seededScore(`${student.id}-progress`, 40, 99),
                    status: statusSeed === 0 ? "Inactive" : "Active",
                };
            })
            .filter(Boolean);

        setStudents(enriched);
        setLoadingStudents(false);
    }, [selectedBatchId]);

    if (isLoading || !user) return null;

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = students.filter(s => s.status === "Active").length;

    return (
        <LMSShell pageTitle="Student Management">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Student Management</div>
                        <div className={styles.bannerSub}>Monitor student progress, attendance, and engagement across your batches.</div>
                    </div>
                    <UsersThree size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Summary */}
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
                        <div className={styles.summaryValue}>{activeCount}</div>
                        <div className={styles.summaryLabel}>Active Students</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: "#faf5ff", color: "#8b5cf6" }}>
                            <ChartBar size={20} weight="duotone" />
                        </div>
                        <div className={styles.summaryValue}>{batches.length}</div>
                        <div className={styles.summaryLabel}>My Batches</div>
                    </div>
                </div>

                {/* Controls */}
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
                    <div className={styles.searchWrapper}>
                        <MagnifyingGlass size={16} color="#9ca3af" />
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search students..."
                        />
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
                    ) : filteredStudents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <UsersThree size={52} color="#cbd5e1" weight="duotone" />
                            <p>No students found. Select a batch or try a different search.</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Attendance</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, idx) => (
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
                                                            width: `${student.progress}%`,
                                                            background: student.progress < 50 ? "#f59e0b" : "#0881ec",
                                                        }}
                                                    />
                                                </div>
                                                <span className={styles.progressPct}>{student.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </LMSShell>
    );
}
