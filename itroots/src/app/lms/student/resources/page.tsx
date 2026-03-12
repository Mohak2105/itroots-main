"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref } from "@/utils/studentContentViewer";
import styles from "./resources.module.css";
import {
    FilePdf,
    FilePpt,
    Books,
    FileText,
    MagnifyingGlass,
    DownloadSimple,
    Tray,
    Folder,
} from "@phosphor-icons/react";

const TYPE_TABS = ["All", "PDF", "PPT", "E-Book"];

const typeIcon = (type: string) => {
    const normalizedType = type?.toUpperCase();
    if (normalizedType === "PDF") return FilePdf;
    if (normalizedType === "PPT") return FilePpt;
    if (normalizedType === "E-BOOK" || normalizedType === "BOOK") return Books;
    return FileText;
};

const typeColor = (type: string) => {
    const normalizedType = type?.toUpperCase();
    if (normalizedType === "PDF") return { color: "#ef4444", bg: "#fee2e2" };
    if (normalizedType === "PPT") return { color: "#f59e0b", bg: "#fef3c7" };
    if (normalizedType === "E-BOOK" || normalizedType === "BOOK") return { color: "#8b5cf6", bg: "#ede9fe" };
    return { color: "#6b7280", bg: "#f3f4f6" };
};

export default function ResourcesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(`${ENDPOINTS.STUDENT.BATCH_RESOURCES}?type=RESOURCE`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setResources(data);
                } else if (data.data && Array.isArray(data.data)) {
                    setResources(data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (isLoading || !user) return null;

    const filtered = resources.filter((resource) => {
        const matchTab = activeTab === "All" || resource.fileType?.toUpperCase() === activeTab.toUpperCase();
        const matchSearch = !search || resource.title?.toLowerCase().includes(search.toLowerCase()) || resource.subject?.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    return (
        <LMSShell pageTitle="Study Materials">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Study Materials</div>
                        <div className={styles.bannerSub}>View PDFs, slides, and e-books for your enrolled courses inside the LMS.</div>
                    </div>
                    <Folder size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.controls}>
                    <div className={styles.tabs}>
                        {TYPE_TABS.map((tab) => (
                            <button
                                key={tab}
                                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.resultCount}>{filtered.length} study materials found</div>

                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className={styles.skeleton} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Tray size={52} color="#cbd5e1" />
                        <h3>No Study Materials Found</h3>
                        <p>Try adjusting your filter or search term.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map((resource: any, index: number) => {
                            const { color, bg } = typeColor(resource.fileType);
                            const IconComp = typeIcon(resource.fileType);
                            const viewerUrl = resource.fileUrl || resource.contentUrl;

                            return (
                                <div key={resource.id || index} className={styles.card}>
                                    <div className={styles.cardTopBar} style={{ background: color }} />
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardHead}>
                                            <div className={styles.fileIcon} style={{ background: bg, color }}>
                                                <IconComp size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.fileMeta}>
                                                <div className={styles.fileName}>{resource.title}</div>
                                                <span className={styles.fileType} style={{ background: bg, color }}>
                                                    {resource.fileType || "FILE"}
                                                </span>
                                            </div>
                                        </div>
                                        {resource.subject && (
                                            <div className={styles.subject}>{resource.subject}</div>
                                        )}
                                        {resource.fileSize && (
                                            <div className={styles.size}>{resource.fileSize}</div>
                                        )}
                                        <div className={styles.cardFooter}>
                                            {resource.uploadedAt && (
                                                <span className={styles.uploadDate}>
                                                    {new Date(resource.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            )}
                                            {viewerUrl ? (
                                                <Link
                                                    href={buildStudentContentViewerHref(viewerUrl, resource.title)}
                                                    className={styles.downloadBtn}
                                                    style={{ background: color }}
                                                >
                                                    <DownloadSimple size={15} weight="bold" /> View
                                                </Link>
                                            ) : (
                                                <button className={styles.downloadBtn} style={{ background: color }} disabled>
                                                    <DownloadSimple size={15} weight="bold" /> View
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
