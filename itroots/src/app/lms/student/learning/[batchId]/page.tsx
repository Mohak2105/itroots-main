"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    Video,
    ClipboardText,
    Exam,
    ArrowLeft,
    MonitorPlay,
    BookOpenText,
    SealCheck,
    FilePdf,
    FileText,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./learning-view.module.css";
import Link from "next/link";

export default function StudentLearningView() {
    const { batchId } = useParams();
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [data, setData] = useState<any>({ contents: [], tests: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"videos" | "resources" | "assignments">("videos");

    const fetchResources = useCallback(async () => {
        if (!token || !batchId) return;
        setLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.STUDENT.BATCH_RESOURCES}/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, batchId]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    if (isLoading || !user) return null;

    const videos = data.contents?.filter((c: any) => c.type === "VIDEO") || [];
    const resources = data.contents?.filter((c: any) => c.type === "RESOURCE" || c.type === "PDF") || [];
    const assignments = data.contents?.filter((c: any) => c.type === "ASSIGNMENT") || [];
    const tests = data.tests || [];

    return (
        <LMSShell pageTitle="Batch Learning">
            <div className={styles.page}>
                {/* Back + Banner */}
                <div className={styles.bannerRow}>
                    <Link href="/lms/student/my-learning" className={styles.backBtn}>
                        <ArrowLeft size={18} /> Back to My Batches
                    </Link>
                </div>

                <div className={styles.grid}>
                    {/* ── Main Content ── */}
                    <div className={styles.contentArea}>
                        {/* Tab Bar */}
                        <div className={styles.tabBar}>
                            <button
                                className={`${styles.tabBtn} ${activeTab === "videos" ? styles.tabBtnActive : ""}`}
                                onClick={() => setActiveTab("videos")}
                            >
                                <MonitorPlay size={16} /> Videos
                                {videos.length > 0 && <span className={styles.tabCount}>{videos.length}</span>}
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === "resources" ? styles.tabBtnActive : ""}`}
                                onClick={() => setActiveTab("resources")}
                            >
                                <FilePdf size={16} /> Resources
                                {resources.length > 0 && <span className={styles.tabCount}>{resources.length}</span>}
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === "assignments" ? styles.tabBtnActive : ""}`}
                                onClick={() => setActiveTab("assignments")}
                            >
                                <ClipboardText size={16} /> Assignments
                                {assignments.length > 0 && <span className={styles.tabCount}>{assignments.length}</span>}
                            </button>
                        </div>

                        {/* Tab Content */}
                        {loading ? (
                            <div className={styles.loadingState}>Loading batch content...</div>
                        ) : activeTab === "videos" ? (
                            <div className={styles.playlist}>
                                {videos.length === 0 ? (
                                    <div className={styles.empty}>No video sessions uploaded for this batch yet.</div>
                                ) : (
                                    videos.map((v: any) => (
                                        <div key={v.id} className={styles.vItem}>
                                            <div className={styles.vIcon}>
                                                <Video size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{v.title}</h4>
                                                <p>{v.description || "Batch Lecture Recording"}</p>
                                            </div>
                                            <a href={v.contentUrl} target="_blank" rel="noreferrer" className={styles.watchBtn}>
                                                Watch Now
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : activeTab === "resources" ? (
                            <div className={styles.playlist}>
                                {resources.length === 0 ? (
                                    <div className={styles.empty}>No resources uploaded for this batch yet.</div>
                                ) : (
                                    resources.map((r: any) => (
                                        <div key={r.id} className={`${styles.vItem} ${styles.resourceItem}`}>
                                            <div className={`${styles.vIcon} ${styles.resourceIcon}`}>
                                                <FilePdf size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{r.title}</h4>
                                                <p>{r.fileType || "Document"} · {r.fileSize || ""}</p>
                                            </div>
                                            <a href={r.fileUrl || r.contentUrl} target="_blank" rel="noreferrer" className={`${styles.watchBtn} ${styles.downloadBtnStyle}`}>
                                                Download
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.playlist}>
                                {assignments.length === 0 ? (
                                    <div className={styles.empty}>No assignments uploaded for this batch yet.</div>
                                ) : (
                                    assignments.map((a: any) => (
                                        <div key={a.id} className={`${styles.vItem} ${styles.assignmentItem}`}>
                                            <div className={`${styles.vIcon} ${styles.assignmentIcon}`}>
                                                <BookOpenText size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{a.title}</h4>
                                                <p>Project Briefing</p>
                                            </div>
                                            <a href={a.contentUrl} target="_blank" rel="noreferrer" className={`${styles.watchBtn} ${styles.assignmentBtnStyle}`}>
                                                Open
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className={styles.sidebar}>
                        {/* Tests Card */}
                        <div className={styles.examCard}>
                            <div className={styles.examHeader}>
                                <Exam size={20} weight="fill" color="#0881ec" />
                                <h4>Batch Tests</h4>
                            </div>
                            <p>Complete scheduled tests to track your competency scores.</p>
                            <div className={styles.testStack}>
                                {tests.length === 0 ? (
                                    <div className={styles.emptySmall}>No active exams for this batch.</div>
                                ) : (
                                    tests.map((t: any) => (
                                        <div key={t.id} className={styles.testStrip}>
                                            <div className={styles.testLabel}>
                                                <span>{t.title}</span>
                                                <small>{t.durationMinutes} min · {t.totalMarks} marks</small>
                                            </div>
                                            <Link href="/lms/student/tests" className={styles.startBtn}>
                                                Start
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Certification info */}
                        <div className={styles.infoCard}>
                            <SealCheck size={32} color="#0881ec" weight="duotone" />
                            <h5>Certification Pathway</h5>
                            <p>Keep your attendance and assignment scores above 80% to qualify for the final certification.</p>
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
