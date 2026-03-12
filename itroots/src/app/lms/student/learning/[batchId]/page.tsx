"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { buildStudentContentViewerHref } from "@/utils/studentContentViewer";
import {
    Video,
    ClipboardText,
    Exam,
    ArrowLeft,
    MonitorPlay,
    BookOpenText,
    SealCheck,
    FilePdf,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./learning-view.module.css";

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
            if (res.ok) {
                setData(json);
            }
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
                <div className={styles.bannerRow}>
                    <Link href="/lms/student/my-learning" className={styles.backBtn}>
                        <ArrowLeft size={18} /> Back to My Batches
                    </Link>
                </div>

                <div className={styles.grid}>
                    <div className={styles.contentArea}>
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
                                <FilePdf size={16} /> Study Materials
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

                        {loading ? (
                            <div className={styles.loadingState}>Loading batch content...</div>
                        ) : activeTab === "videos" ? (
                            <div className={styles.playlist}>
                                {videos.length === 0 ? (
                                    <div className={styles.empty}>No video sessions uploaded for this batch yet.</div>
                                ) : (
                                    videos.map((video: any) => (
                                        <div key={video.id} className={styles.vItem}>
                                            <div className={styles.vIcon}>
                                                <Video size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{video.title}</h4>
                                                <p>{video.description || "Batch lecture recording"}</p>
                                            </div>
                                            <Link href={buildStudentContentViewerHref(video.contentUrl, video.title)} className={styles.watchBtn}>
                                                Watch Now
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : activeTab === "resources" ? (
                            <div className={styles.playlist}>
                                {resources.length === 0 ? (
                                    <div className={styles.empty}>No study materials uploaded for this batch yet.</div>
                                ) : (
                                    resources.map((resource: any) => (
                                        <div key={resource.id} className={`${styles.vItem} ${styles.resourceItem}`}>
                                            <div className={`${styles.vIcon} ${styles.resourceIcon}`}>
                                                <FilePdf size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{resource.title}</h4>
                                                <p>{resource.fileType || "Document"}{resource.fileSize ? ` | ${resource.fileSize}` : ""}</p>
                                            </div>
                                            <Link href={buildStudentContentViewerHref(resource.fileUrl || resource.contentUrl, resource.title)} className={`${styles.watchBtn} ${styles.downloadBtnStyle}`}>
                                                View Materials
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.playlist}>
                                {assignments.length === 0 ? (
                                    <div className={styles.empty}>No assignments uploaded for this batch yet.</div>
                                ) : (
                                    assignments.map((assignment: any) => (
                                        <div key={assignment.id} className={`${styles.vItem} ${styles.assignmentItem}`}>
                                            <div className={`${styles.vIcon} ${styles.assignmentIcon}`}>
                                                <BookOpenText size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.vMeta}>
                                                <h4>{assignment.title}</h4>
                                                <p>{assignment.description || "Project briefing"}</p>
                                            </div>
                                            <Link href={buildStudentContentViewerHref(assignment.contentUrl, assignment.title)} className={`${styles.watchBtn} ${styles.assignmentBtnStyle}`}>
                                                Open Assignment
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className={styles.sidebar}>
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
                                    tests.map((test: any) => (
                                        <div key={test.id} className={styles.testStrip}>
                                            <div className={styles.testLabel}>
                                                <span>{test.title}</span>
                                                <small>{test.durationMinutes} min | {test.totalMarks} marks</small>
                                            </div>
                                            <Link href="/lms/student/tests" className={styles.startBtn}>
                                                Start
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

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
