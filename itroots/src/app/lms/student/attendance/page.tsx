"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { CalendarCheck, WarningCircle, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./attendance.module.css";

type AttendanceRecord = {
    id: string;
    date?: string;
    status?: string;
};

type AttendanceBatchData = {
    total: number;
    present: number;
    absent: number;
    late: number;
    records: AttendanceRecord[];
};

type AttendanceMap = Record<string, AttendanceBatchData>;

type CalendarCell = {
    date: Date;
    key: string;
    dayNumber: number;
    inCurrentMonth: boolean;
    isToday: boolean;
    status?: string;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const formatDateLabel = (value?: string) => {
    const date = parseDate(value);
    if (!date) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateFromKey = (key: string) => {
    const date = new Date(`${key}T00:00:00`);
    if (Number.isNaN(date.getTime())) return key;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const buildCalendarCells = (
    monthDate: Date,
    statusByDate: Map<string, string>
): CalendarCell[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const todayKey = toDateKey(new Date());

    const cells: CalendarCell[] = [];

    for (let i = 0; i < 42; i += 1) {
        let date: Date;
        let inCurrentMonth = true;

        if (i < firstDay) {
            const day = daysInPrevMonth - firstDay + i + 1;
            date = new Date(year, month - 1, day);
            inCurrentMonth = false;
        } else if (i >= firstDay + daysInMonth) {
            const day = i - (firstDay + daysInMonth) + 1;
            date = new Date(year, month + 1, day);
            inCurrentMonth = false;
        } else {
            const day = i - firstDay + 1;
            date = new Date(year, month, day);
        }

        const key = toDateKey(date);
        cells.push({
            date,
            key,
            dayNumber: date.getDate(),
            inCurrentMonth,
            isToday: key === todayKey,
            status: statusByDate.get(key),
        });
    }

    return cells;
};

export default function StudentAttendancePage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [attendanceData, setAttendanceData] = useState<AttendanceMap>({});
    const [loadingData, setLoadingData] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDateByBatch, setSelectedDateByBatch] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.STUDENT.ATTENDANCE, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success && data.data) {
                    setAttendanceData(data.data as AttendanceMap);
                }
                setLoadingData(false);
            })
            .catch((error) => {
                console.error("Failed to fetch attendance:", error);
                setLoadingData(false);
            });
    }, [token]);

    const monthLabel = useMemo(
        () => currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        [currentMonth]
    );

    const goPrevMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goCurrentMonth = () => {
        const now = new Date();
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    const getStatusClass = (status?: string) => {
        const value = (status || "").toUpperCase();
        if (value === "PRESENT") return styles.present;
        if (value === "ABSENT") return styles.absent;
        if (value === "LATE") return styles.late;
        return "";
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="My Attendance">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Attendance Records</div>
                        <div className={styles.bannerSub}>Track your attendance day-by-day in calendar format.</div>
                    </div>
                    <CalendarCheck size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.calendarToolbar}>
                    <button type="button" className={styles.navBtn} onClick={goPrevMonth}>
                        <CaretLeft size={16} weight="bold" />
                    </button>
                    <div className={styles.monthLabel}>{monthLabel}</div>
                    <button type="button" className={styles.navBtn} onClick={goNextMonth}>
                        <CaretRight size={16} weight="bold" />
                    </button>
                    <button type="button" className={styles.todayBtn} onClick={goCurrentMonth}>Current Month</button>
                </div>

                {loadingData ? (
                    <div className={styles.calendarSections}>
                        {[1, 2].map((item) => <div key={item} className={styles.skeleton} />)}
                    </div>
                ) : Object.keys(attendanceData).length === 0 ? (
                    <div className={styles.emptyState}>
                        <CalendarCheck size={52} color="#94a3b8" weight="duotone" />
                        <h3>No Attendance Records Yet</h3>
                        <p>Your teacher has not marked attendance for your enrolled batches yet.</p>
                    </div>
                ) : (
                    <div className={styles.calendarSections}>
                        {Object.entries(attendanceData).map(([batchName, data]) => {
                            const safeTotal = data.total || 0;
                            const percentage = safeTotal > 0 ? Math.round((data.present / safeTotal) * 100) : 0;

                            const statusByDate = new Map<string, string>();
                            const recordsByDate = new Map<string, AttendanceRecord[]>();

                            data.records.forEach((record) => {
                                const parsed = parseDate(record.date);
                                if (!parsed) return;
                                const key = toDateKey(parsed);
                                statusByDate.set(key, (record.status || "").toUpperCase());
                                const existing = recordsByDate.get(key) || [];
                                recordsByDate.set(key, [...existing, record]);
                            });

                            const cells = buildCalendarCells(currentMonth, statusByDate);
                            const selectedDateKey = selectedDateByBatch[batchName] || toDateKey(new Date());
                            const selectedRecords = recordsByDate.get(selectedDateKey) || [];

                            return (
                                <section key={batchName} className={styles.calendarCard}>
                                    {/* Batch header removed */}

                                    {percentage < 75 ? (
                                        <div className={styles.warningBanner}>
                                            <WarningCircle size={18} weight="fill" />
                                            Attendance below 75%. Please attend more classes.
                                        </div>
                                    ) : null}

                                    <div className={styles.calendarGridWrap}>
                                        <div className={styles.weekHeader}>
                                            {WEEK_DAYS.map((day) => (
                                                <div key={`${batchName}-${day}`} className={styles.weekDay}>{day}</div>
                                            ))}
                                        </div>

                                        <div className={styles.daysGrid}>
                                            {cells.map((cell) => (
                                                <button
                                                    type="button"
                                                    key={`${batchName}-${cell.key}`}
                                                    className={[
                                                        styles.dayCell,
                                                        !cell.inCurrentMonth ? styles.outsideMonth : "",
                                                        cell.isToday ? styles.todayCell : "",
                                                        selectedDateKey === cell.key ? styles.selectedCell : "",
                                                        getStatusClass(cell.status),
                                                    ].join(" ").trim()}
                                                    onClick={() => {
                                                        setSelectedDateByBatch((prev) => ({ ...prev, [batchName]: cell.key }));
                                                    }}
                                                >
                                                    <span className={styles.dayNumber}>{cell.dayNumber}</span>
                                                    {cell.status ? <span className={`${styles.dot} ${getStatusClass(cell.status)}`} /> : null}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.dayDetail}>
                                        <div className={styles.dayDetailTitle}>Selected Date: {formatDateFromKey(selectedDateKey)}</div>
                                        {selectedRecords.length === 0 ? (
                                            <p className={styles.dayDetailEmpty}>No attendance marked on this date.</p>
                                        ) : (
                                            <div className={styles.dayDetailList}>
                                                {selectedRecords.map((record) => (
                                                    <div key={record.id} className={styles.dayDetailItem}>
                                                        <span>{formatDateLabel(record.date)}</span>
                                                        <span className={`${styles.statusPill} ${getStatusClass(record.status)}`}>
                                                            {(record.status || "-").toUpperCase()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
