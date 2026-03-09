"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { CaretLeft, CaretRight, CalendarDots, Clock, BookOpen, Link as LinkIcon } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "../../Faculty/calendar/calendar.module.css";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EVENT_COLORS = ["#0881ec", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

const sameDate = (date: Date, value: string) => {
    const eventDate = new Date(value);
    return eventDate.getFullYear() === date.getFullYear()
        && eventDate.getMonth() === date.getMonth()
        && eventDate.getDate() === date.getDate();
};

export default function StudentCalendarPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [liveClasses, setLiveClasses] = useState<any[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.STUDENT.LIVE_CLASSES, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setLiveClasses(data);
            })
            .catch(console.error);
    }, [token]);

    const colorByBatch = useMemo(() => {
        const map = new Map<string, string>();
        liveClasses.forEach((item, index) => {
            if (!map.has(item.batchId)) {
                map.set(item.batchId, EVENT_COLORS[index % EVENT_COLORS.length]);
            }
        });
        return map;
    }, [liveClasses]);

    if (isLoading || !user) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();

    const prev = () => setCurrentDate(new Date(year, month - 1, 1));
    const next = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelected = (day: number) =>
        day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    const getEventsForDate = (date: Date) => liveClasses
        .filter((item) => sameDate(date, item.scheduledAt))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .map((item) => ({
            ...item,
            time: new Date(item.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
            color: colorByBatch.get(item.batchId) || EVENT_COLORS[0],
        }));

    const selectedEvents = getEventsForDate(selectedDate);

    return (
        <LMSShell pageTitle="Schedule">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Live Class Schedule</div>
                        <div className={styles.bannerSub}>View upcoming live classes for your assigned batches.</div>
                    </div>
                    <CalendarDots size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.calLayout}>
                    <div className={styles.calendarCard}>
                        <div className={styles.calHeader}>
                            <button className={styles.navBtn} onClick={prev}><CaretLeft size={18} weight="bold" /></button>
                            <div className={styles.calMonthGroup}>
                                <span className={styles.calMonth}>{MONTH_NAMES[month]} {year}</span>
                                <button className={styles.todayBtn} onClick={goToday}>Today</button>
                            </div>
                            <button className={styles.navBtn} onClick={next}><CaretRight size={18} weight="bold" /></button>
                        </div>

                        <div className={styles.weekRow}>
                            {WEEK_DAYS.map((day) => <div key={day} className={styles.weekLabel}>{day}</div>)}
                        </div>

                        <div className={styles.daysGrid}>
                            {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className={styles.dayCell} />)}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const date = new Date(year, month, day);
                                const events = getEventsForDate(date);
                                return (
                                    <div key={day} className={`${styles.dayCell} ${styles.dayCellClickable} ${isToday(day) ? styles.todayCell : ""} ${isSelected(day) && !isToday(day) ? styles.selectedCell : ""}`} onClick={() => setSelectedDate(new Date(year, month, day))}>
                                        <span className={styles.dayNum}>{day}</span>
                                        {events.length ? (
                                            <div className={styles.eventDots}>
                                                {events.slice(0, 3).map((event, dotIndex) => (
                                                    <span key={`${event.id}-${dotIndex}`} className={styles.dot} style={{ background: event.status === "CANCELLED" ? "#ef4444" : event.color }} />
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.eventsPanel}>
                        <div className={styles.eventsPanelHeader}>
                            <div>
                                <div className={styles.eventsPanelDay}>{selectedDate.toLocaleDateString("en-IN", { weekday: "long" })}</div>
                                <div className={styles.eventsPanelDate}>{selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                            </div>
                        </div>

                        <div className={styles.eventsBody}>
                            {selectedEvents.length === 0 ? (
                                <div className={styles.noEvents}>
                                    <CalendarDots size={44} color="#cbd5e1" weight="duotone" />
                                    <p>No live classes on this day</p>
                                </div>
                            ) : (
                                <div className={styles.eventsList}>
                                    {selectedEvents.map((event) => (
                                        <div key={event.id} className={styles.eventItem}>
                                            <div className={styles.eventAccent} style={{ background: event.status === "CANCELLED" ? "#ef4444" : event.color }} />
                                            <div className={styles.eventInfo} style={{ width: "100%" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                                                    <div className={styles.eventTitle}>{event.title}</div>
                                                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: "999px", background: event.status === "CANCELLED" ? "#fee2e2" : "#dcfce7", color: event.status === "CANCELLED" ? "#b91c1c" : "#166534" }}>{event.status}</span>
                                                </div>
                                                <div className={styles.eventMeta}><BookOpen size={12} /><span>{event.course?.title} / {event.batch?.name}</span></div>
                                                <div className={styles.eventMeta}><Clock size={12} /><span>{event.time}</span></div>
                                                <div className={styles.eventMeta}><LinkIcon size={12} /><a href={event.meetingLink} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Join link</a></div>
                                                {event.description ? <div className={styles.eventMeta}><span>{event.description}</span></div> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
