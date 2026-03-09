"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./student-learning.module.css";
import Link from "next/link";
import {
    BookOpen,
    ArrowRight,
    HourglassMedium,
    PlusCircle,
    User,
    GraduationCap,
} from "@phosphor-icons/react";

export default function StudentLearningPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.STUDENT.MY_LEARNING, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setEnrollments(d); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="My Learning">
            <div className={styles.page}>
                {/* Header Banner */}
                <div className={styles.banner}>
                    <div className={styles.bannerContent}>
                        <div className={styles.bannerTitle}>My Enrolled Batches</div>
                        <div className={styles.bannerSub}>
                            {loading ? "Loading..." : `${enrollments.length} batch${enrollments.length !== 1 ? "es" : ""} enrolled`}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <HourglassMedium size={56} color="#cbd5e1" weight="duotone" />
                        <h3>No Batches Enrolled Yet</h3>
                        <p>Explore available batches and start your learning journey today.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {enrollments.map((item: any) => (
                            <div key={item.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.courseTag}>{item.batch?.course?.title || "Course"}</div>
                                    <div className={styles.courseAvatar}>
                                        <BookOpen size={28} weight="duotone" />
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <h3 className={styles.batchName}>{item.batch?.name || "Batch"}</h3>
                                    <div className={styles.FacultyRow}>
                                        <div className={styles.FacultyAvatar}>
                                            {item.batch?.Faculty?.name?.charAt(0) || "T"}
                                        </div>
                                        <span className={styles.FacultyName}>
                                            {item.batch?.Faculty?.name || "Senior Faculty"}
                                        </span>
                                    </div>
                                    {item.batch?.schedule && (
                                        <div className={styles.schedule}>
                                            Schedule: {item.batch.schedule}
                                        </div>
                                    )}
                                    <div className={styles.progressSection}>
                                        <div className={styles.progressLabel}>
                                            <span>Progress</span>
                                            <span className={styles.progressPct}>{item.progressPercent || 0}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${item.progressPercent || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <Link
                                        href={`/lms/student/learning/${item.batch?.id}`}
                                        className={styles.continueBtn}
                                    >
                                        Continue Learning <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
