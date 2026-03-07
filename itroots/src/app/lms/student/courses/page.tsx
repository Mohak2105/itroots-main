"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { getEnrollmentsForStudent, getCourseById } from "@/data/lms-data";

import {
    Robot,
    Coffee,
    Lock,
    Books,
    BookOpen
} from "@phosphor-icons/react";
import styles from "./courses.module.css";

const COURSE_ICONS: Record<string, React.ElementType> = {
    c1: Robot,
    c2: Coffee,
    c3: Lock
};
const COURSE_COLORS: Record<string, string> = {
    c1: "linear-gradient(135deg,#0c2d4c,#0881ec)",
    c2: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    c3: "linear-gradient(135deg,#047857,#34d399)",
};

export default function StudentCoursesPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/lms/login");
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const enrollments = getEnrollmentsForStudent(user.id);

    return (
        <LMSShell pageTitle="My Courses">
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>My Enrolled Courses</h2>
                <p className={styles.pageSubtitle}>
                    {enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled
                </p>
            </div>

            {enrollments.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Books size={64} color="#9ca3af" />
                    </div>
                    <h3>No courses enrolled yet</h3>
                    <p>Contact your administrator to get enrolled in a course.</p>
                </div>
            ) : (
                <div className={styles.coursesGrid}>
                    {enrollments.map((enrollment) => {
                        const course = getCourseById(enrollment.courseId);
                        if (!course) return null;
                        const totalLessons = course.modules.flatMap((m) => m.lessons).length;
                        const completed = enrollment.completedLessonIds.length;

                        return (
                            <div key={enrollment.id} className={styles.courseCard}>
                                <div
                                    className={styles.cardThumb}
                                    style={{ background: COURSE_COLORS[course.id] ?? COURSE_COLORS.c1 }}
                                >
                                    <span className={styles.cardEmoji}>
                                        {(() => {
                                            const Icon = COURSE_ICONS[course.id] || BookOpen;
                                            return <Icon size={32} color="#fff" weight="fill" />;
                                        })()}
                                    </span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardMeta}>
                                        {course.modules.length} modules · {totalLessons} lessons
                                    </div>
                                    <h3 className={styles.cardTitle}>{course.title}</h3>
                                    <p className={styles.cardDesc}>{course.description}</p>

                                    <div className={styles.progressRow}>
                                        <span className={styles.progressLabel}>
                                            {completed}/{totalLessons} lessons
                                        </span>
                                        <span className={styles.progressPct}>{enrollment.progress}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${enrollment.progress}%` }} />
                                    </div>

                                    <div className={styles.cardActions}>
                                        <Link
                                            href={`/lms/student/courses/${course.id}`}
                                            className={styles.btnPrimary}
                                        >
                                            {enrollment.progress > 0 ? "Continue Learning →" : "Start Learning →"}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </LMSShell>
    );
}
