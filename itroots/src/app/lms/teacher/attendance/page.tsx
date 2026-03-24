"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import { ENDPOINTS } from "@/config/api";
import {
    CalendarCheck,
    CheckCircle,
    MagnifyingGlass,
    WarningCircle,
} from "@/components/icons/lucide-phosphor";
import styles from "./attendance.module.css";

type AttendanceStatus = "PRESENT" | "ABSENT";

type Batch = {
    id: string;
    name: string;
    course?: {
        id: string;
        title: string;
    };
};

type Enrollment = {
    id: string;
    student: {
        id: string;
        name: string;
        email?: string;
        username?: string;
    };
};

type AttendanceRecord = {
    id: string;
    studentId: string;
    status: AttendanceStatus;
    date: string;
    remarks?: string;
};

const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const formatDate = (value: string) =>
    parseLocalDate(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const toDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getTodayDateValue = () => toDateValue(new Date());

export default function TeacherAttendancePage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();

    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [search, setSearch] = useState("");
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const currentDateValue = getTodayDateValue();

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    const selectedBatch = useMemo(
        () => batches.find((batch) => batch.id === selectedBatchId) || null,
        [batches, selectedBatchId]
    );

    const loadBatches = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(ENDPOINTS.Faculty.MY_BATCHES, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => []);
            const nextBatches = Array.isArray(data) ? data : data?.batches || [];
            setBatches(nextBatches);
            setSelectedBatchId((current) => current || nextBatches[0]?.id || "");
        } catch (error) {
            console.error("Failed to fetch teacher batches:", error);
            setBatches([]);
        }
    }, [token]);

    const loadAttendanceData = useCallback(async () => {
        if (!token || !selectedBatchId) {
            setEnrollments([]);
            setAttendanceRecords({});
            setLoadingData(false);
            return;
        }

        setLoadingData(true);
        setMessage(null);

        try {
            const attendanceResponse = await fetch(
                ENDPOINTS.Faculty.BATCH_ATTENDANCE(selectedBatchId, currentDateValue),
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const attendanceJson = await attendanceResponse.json().catch(() => null);
            if (!attendanceResponse.ok) {
                throw new Error(attendanceJson?.message || "Unable to load batch attendance.");
            }

            const nextEnrollments = Array.isArray(attendanceJson?.enrollments) ? attendanceJson.enrollments : [];
            const existingRecords = Array.isArray(attendanceJson?.data) ? attendanceJson.data : [];
            const nextRecords: Record<string, AttendanceStatus> = {};

            nextEnrollments.forEach((enrollment: Enrollment) => {
                nextRecords[enrollment.student.id] = "ABSENT";
            });

            existingRecords.forEach((record: AttendanceRecord) => {
                if (record.studentId) {
                    nextRecords[record.studentId] = record.status;
                }
            });

            setEnrollments(nextEnrollments);
            setAttendanceRecords(nextRecords);
        } catch (error) {
            console.error("Failed to load attendance data:", error);
            setEnrollments([]);
            setAttendanceRecords({});
            setMessage({ type: "error", text: "Unable to load batch attendance right now." });
        } finally {
            setLoadingData(false);
        }
    }, [currentDateValue, selectedBatchId, token]);

    useEffect(() => {
        if (token) {
            void loadBatches();
        }
    }, [loadBatches, token]);

    useEffect(() => {
        if (token && selectedBatchId) {
            void loadAttendanceData();
        }
    }, [loadAttendanceData, selectedBatchId, token]);

    const filteredEnrollments = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return enrollments;
        return enrollments.filter((enrollment) => {
            const name = enrollment.student.name?.toLowerCase() || "";
            const email = enrollment.student.email?.toLowerCase() || "";
            const username = enrollment.student.username?.toLowerCase() || "";
            return name.includes(query) || email.includes(query) || username.includes(query);
        });
    }, [enrollments, search]);

    const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
        setAttendanceRecords((current) => ({
            ...current,
            [studentId]: status,
        }));
    };

    const saveAttendance = async () => {
        if (!token || !selectedBatchId) return;

        setSaving(true);
        setMessage(null);

        try {
            const records = enrollments.map((enrollment) => ({
                studentId: enrollment.student.id,
                status: attendanceRecords[enrollment.student.id] || "ABSENT",
            }));

            const response = await fetch(ENDPOINTS.Faculty.ATTENDANCE, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    batchId: selectedBatchId,
                    date: currentDateValue,
                    records,
                }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to save attendance.");
            }

            setMessage({ type: "success", text: "Attendance updated successfully." });
            await loadAttendanceData();
        } catch (error) {
            console.error("Save attendance error:", error);
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Unable to save attendance.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Attendance">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Attendance</div>
                        <div className={styles.bannerSub}>
                            Select a batch and mark attendance for the current date only.
                        </div>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.filterWrap}>
                        <label className={styles.controlLabel}>Batch</label>
                        <CustomSelect
                            value={selectedBatchId}
                            onChange={setSelectedBatchId}
                            options={[
                                { value: "", label: "Select batch" },
                                ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
                            ]}
                            placeholder="Select batch"
                        />
                    </div>

                    <div className={styles.dateWrap}>
                        <label className={styles.controlLabel}>Attendance Date</label>
                        <div className={`${styles.dateField} ${styles.dateFieldLocked}`}>
                            <CalendarCheck size={18} weight="duotone" />
                            <span className={styles.dateValue}>{formatDate(currentDateValue)}</span>
                        </div>
                    </div>

                    <div className={styles.searchWrap}>
                        <label className={styles.controlLabel}>Search Student</label>
                        <div className={styles.searchField}>
                            <MagnifyingGlass size={16} className={styles.searchIcon} />
                            <input
                                className={styles.searchInput}
                                placeholder="Search by name or email"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.actionWrap}>
                        <span className={styles.controlLabel}>&nbsp;</span>
                        <button
                            type="button"
                            className={styles.saveButton}
                            onClick={() => void saveAttendance()}
                            disabled={saving || !selectedBatchId || enrollments.length === 0}
                        >
                            <CheckCircle size={18} weight="duotone" />
                            <span>{saving ? "Saving..." : "Save Attendance"}</span>
                        </button>
                    </div>
                </div>

                {message ? (
                    <div className={message.type === "success" ? styles.successBanner : styles.errorBanner}>
                        {message.text}
                    </div>
                ) : null}

                <section className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <div>
                            <h2>Batch Attendance</h2>
                            <p>
                                {selectedBatch
                                    ? `${selectedBatch.name}${selectedBatch.course?.title ? ` - ${selectedBatch.course.title}` : ""} - ${formatDate(currentDateValue)}`
                                    : "Choose a batch to start marking attendance."}
                            </p>
                        </div>
                    </div>

                    {loadingData ? (
                        <div className={styles.emptyState}>Loading students...</div>
                    ) : !selectedBatchId ? (
                        <div className={styles.emptyState}>Select a batch to view students.</div>
                    ) : filteredEnrollments.length === 0 ? (
                        <div className={styles.emptyState}>No students found for this batch.</div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Mark Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEnrollments.map((enrollment) => {
                                        const currentStatus = attendanceRecords[enrollment.student.id] || "ABSENT";

                                        return (
                                            <tr key={enrollment.student.id}>
                                                <td>
                                                    <div className={styles.studentCell}>
                                                        <div>
                                                            <div className={styles.studentName}>{enrollment.student.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.emailCell}>
                                                    {enrollment.student.email || "No email"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`${styles.statusPill} ${
                                                            currentStatus === "PRESENT"
                                                                ? styles.presentPill
                                                                : styles.absentPill
                                                        }`}
                                                    >
                                                        {currentStatus === "PRESENT" ? "Present" : "Absent"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.toggleControl}>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={currentStatus === "PRESENT"}
                                                            aria-label={`Mark ${enrollment.student.name} as ${
                                                                currentStatus === "PRESENT" ? "absent" : "present"
                                                            }`}
                                                            className={`${styles.toggleButton} ${
                                                                currentStatus === "PRESENT"
                                                                    ? styles.toggleButtonActive
                                                                    : styles.toggleButtonInactive
                                                            }`}
                                                            onClick={() =>
                                                                updateStudentStatus(
                                                                    enrollment.student.id,
                                                                    currentStatus === "PRESENT" ? "ABSENT" : "PRESENT"
                                                                )
                                                            }
                                                        >
                                                            <span className={styles.toggleTrack}>
                                                                <span className={styles.toggleThumb} />
                                                            </span>
                                                            <span className={styles.toggleText}>
                                                                {currentStatus === "PRESENT" ? "Present" : "Absent"}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className={styles.helpCard}>
                    <WarningCircle size={18} weight="fill" />
                    <span>
                        Attendance can only be marked for <strong>today</strong>. Students default to <strong>Absent</strong> until you mark them as <strong>Present</strong>.
                    </span>
                </div>
            </div>
        </LMSShell>
    );
}
