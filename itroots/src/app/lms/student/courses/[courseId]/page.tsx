"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    getCourseById,
    getEnrollmentsForStudent,
    type Lesson,
    type Module,
} from "@/data/lms-data";
import {
    CheckCircle,
    PlayCircle,
    DownloadSimple,
    Prohibit,
    Video,
    Timer,
    Circle
} from "@/components/icons/lucide-phosphor";
import styles from "./course-detail.module.css";

export default function CourseDetailPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params?.courseId as string;

    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/student/login");
    }, [user, isLoading, router]);

    const course = getCourseById(courseId);
    const enrollments = user ? getEnrollmentsForStudent(user.id) : [];
    const enrollment = enrollments.find((e) => e.courseId === courseId);

    useEffect(() => {
        if (enrollment) {
            setCompletedIds(enrollment.completedLessonIds);
        }
        if (course && !activeLesson) {
            // auto-select first lesson
            const firstLesson = course.modules[0]?.lessons[0];
            if (firstLesson) setActiveLesson(firstLesson);
        }
    }, [course, enrollment]);

    if (isLoading || !user) return null;

    if (!course || !enrollment) {
        return (
            <LMSShell pageTitle="Course">
                <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    <div style={{ marginBottom: "1rem" }}>
                        <Prohibit size={64} weight="bold" color="#ef4444" />
                    </div>
                    <h2 style={{ fontFamily: "Outfit", marginBottom: "0.5rem" }}>Course not found</h2>
                    <p>You may not be enrolled in this course.</p>
                </div>
            </LMSShell>
        );
    }

    function markComplete(lesson: Lesson) {
        if (!completedIds.includes(lesson.id)) {
            setCompletedIds((prev) => [...prev, lesson.id]);
        }
    }

    const allLessons = course.modules.flatMap((m) => m.lessons);
    const progress = Math.round((completedIds.length / allLessons.length) * 100);

    // Find next lesson
    function getNextLesson(current: Lesson): Lesson | null {
        const idx = allLessons.findIndex((l) => l.id === current.id);
        return allLessons[idx + 1] ?? null;
    }

    return (
        <LMSShell pageTitle={course.title}>
            <div className={styles.layout}>
                {/* â”€â”€ Left: Lesson Player â”€â”€ */}
                <div className={styles.playerSection}>
                    {activeLesson ? (
                        <>
                            {/* Video Player */}
                            <div className={styles.videoWrapper}>
                                <iframe
                                    key={activeLesson.id}
                                    src={`${activeLesson.youtubeUrl}?rel=0&modestbranding=1&autoplay=0`}
                                    title={activeLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className={styles.videoIframe}
                                />
                            </div>

                            {/* Lesson Info */}
                            <div className={styles.lessonInfo}>
                                <div className={styles.lessonBreadcrumb}>
                                    {course.modules.find((m) =>
                                        m.lessons.some((l) => l.id === activeLesson.id)
                                    )?.title}
                                </div>
                                <h2 className={styles.lessonTitle}>{activeLesson.title}</h2>
                                <p className={styles.lessonDesc}>{activeLesson.description}</p>

                                <div className={styles.lessonActions}>
                                    <button
                                        className={`${styles.markBtn} ${completedIds.includes(activeLesson.id) ? styles.markBtnDone : ""}`}
                                        onClick={() => markComplete(activeLesson)}
                                        disabled={completedIds.includes(activeLesson.id)}
                                        type="button"
                                    >
                                        {completedIds.includes(activeLesson.id) ? (
                                            <><CheckCircle size={20} weight="fill" /> Completed</>
                                        ) : "Mark as Complete"}
                                    </button>

                                    {getNextLesson(activeLesson) && (
                                        <button
                                            className={styles.nextBtn}
                                            onClick={() => {
                                                markComplete(activeLesson);
                                                setActiveLesson(getNextLesson(activeLesson)!);
                                            }}
                                            type="button"
                                        >
                                            Next Lesson →
                                        </button>
                                    )}

                                    {activeLesson.pdfUrl && (
                                        <a href={activeLesson.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfBtn}>
                                            <DownloadSimple size={18} style={{ marginRight: '0.4rem' }} /> Download Notes
                                        </a>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noLesson}>
                            <div style={{ marginBottom: '1rem' }}>
                                <Video size={64} color="#9ca3af" />
                            </div>
                            <p>Select a lesson from the sidebar to start watching</p>
                        </div>
                    )}
                </div>

                {/* â”€â”€ Right: Curriculum Sidebar â”€â”€ */}
                <aside className={styles.curriculum}>
                    {/* Progress */}
                    <div className={styles.curriculumProgress}>
                        <div className={styles.progressHeader}>
                            <span>Course Progress</span>
                            <span className={styles.progressPct}>{progress}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                        <div className={styles.progressMeta}>
                            {completedIds.length}/{allLessons.length} lessons completed
                        </div>
                    </div>

                    {/* Modules + Lessons */}
                    <div className={styles.moduleList}>
                        {course.modules.map((mod: Module) => (
                            <div key={mod.id} className={styles.moduleItem}>
                                <div className={styles.moduleHeader}>
                                    <span className={styles.moduleTitle}>{mod.title}</span>
                                    <span className={styles.moduleMeta}>{mod.lessons.length} lessons</span>
                                </div>
                                <div className={styles.lessonList}>
                                    {mod.lessons.map((lesson) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isDone = completedIds.includes(lesson.id);
                                        return (
                                            <button
                                                key={lesson.id}
                                                className={`${styles.lessonItem} ${isActive ? styles.lessonActive : ""} ${isDone ? styles.lessonDone : ""}`}
                                                onClick={() => setActiveLesson(lesson)}
                                                type="button"
                                            >
                                                <div className={styles.lessonStatus}>
                                                    {isDone ? (
                                                        <CheckCircle size={18} color="#10b981" weight="fill" />
                                                    ) : isActive ? (
                                                        <PlayCircle size={18} color="#0881ec" weight="fill" />
                                                    ) : (
                                                        <Circle size={18} color="#e5e7eb" />
                                                    )}
                                                </div>
                                                <div className={styles.lessonMeta}>
                                                    <span className={styles.lessonItemTitle}>{lesson.title}</span>
                                                    <span className={styles.lessonDuration}>
                                                        <Timer size={14} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> {lesson.duration}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </LMSShell>
    );
}
