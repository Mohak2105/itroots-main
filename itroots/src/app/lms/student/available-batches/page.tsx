"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    CalendarBlank,
    ArrowLeft,
    Lightning,
    CheckCircle,
    UsersThree,
    MagnifyingGlass,
    ArrowRight
} from "@/components/icons/lucide-phosphor";
import { ENDPOINTS } from "@/config/api";
import styles from "./available-batches.module.css";
import Link from "next/link";

export default function AvailableBatchesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    const fetchAvailable = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(ENDPOINTS.STUDENT.AVAILABLE_BATCHES, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setBatches(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAvailable();
    }, [token]);

    const handleEnroll = async (batchId: string) => {
        if (!confirm("Are you sure you want to enroll in this batch?")) return;
        try {
            const res = await fetch(ENDPOINTS.STUDENT.SELF_ENROLL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ batchId })
            });
            if (res.ok) {
                alert("Enrolled successfully!");
                router.push("/student/my-learning");
            } else {
                const err = await res.json();
                alert(err.message || "Enrollment failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during enrollment.");
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Available Academic Batches">
            <div className={styles.header}>
                <Link href="/student/my-learning" className={styles.backBtn}><ArrowLeft /> Back to Courses</Link>
                <div className={styles.titleInfo}>
                    <h1>Select Your Batch</h1>
                    <p>Choose a schedule and cohort that fits your learning pace.</p>
                </div>
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.empty}>Loading active cohorts...</div>
                ) : batches.length === 0 ? (
                    <div className={styles.empty}>No new batches available for enrollment at this time.</div>
                ) : (
                    batches.map(batch => (
                        <div key={batch.id} className={styles.batchCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.courseName}>{batch.course?.title}</div>
                                <h3>{batch.name}</h3>
                            </div>

                            <div className={styles.details}>
                                <div className={styles.detailItem}>
                                    <CalendarBlank size={20} color="#0ea5e9" />
                                    <div>
                                        <span>Schedule</span>
                                        <p>{batch.schedule}</p>
                                    </div>
                                </div>
                                <div className={styles.detailItem}>
                                    <Lightning size={20} color="#d97706" />
                                    <div>
                                        <span>Faculty</span>
                                        <p>{batch.Faculty?.name || "LMS Expert"}</p>
                                    </div>
                                </div>
                                <div className={styles.detailItem}>
                                    <UsersThree size={20} color="#059669" />
                                    <div>
                                        <span>Timing</span>
                                        <p>{batch.startDate} — {batch.endDate}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => handleEnroll(batch.id)} className={styles.enrollBtn}>
                                Request Enrollment <ArrowRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </LMSShell>
    );
}
