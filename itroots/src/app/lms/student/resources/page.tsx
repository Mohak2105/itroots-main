"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./resources.module.css";
import {
    FilePdf,
    FilePpt,
    Books,
    FileText,
    VideoCamera,
    MagnifyingGlass,
    DownloadSimple,
    Tray,
    Folder,
} from "@phosphor-icons/react";

type FileType = "PDF" | "PPT" | "BOOK" | "VIDEO" | "OTHER";

const TYPE_TABS = ["All", "PDF", "PPT", "Book", "Video"];

const typeIcon = (type: string) => {
    const t = type?.toUpperCase();
    if (t === "PDF") return FilePdf;
    if (t === "PPT") return FilePpt;
    if (t === "BOOK") return Books;
    if (t === "VIDEO") return VideoCamera;
    return FileText;
};

const typeColor = (type: string) => {
    const t = type?.toUpperCase();
    if (t === "PDF") return { color: "#ef4444", bg: "#fee2e2" };
    if (t === "PPT") return { color: "#f59e0b", bg: "#fef3c7" };
    if (t === "BOOK") return { color: "#8b5cf6", bg: "#ede9fe" };
    if (t === "VIDEO") return { color: "#0881ec", bg: "#eff6ff" };
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
            .then(r => r.json())
            .then(d => {
                if (Array.isArray(d)) setResources(d);
                else if (d.data && Array.isArray(d.data)) setResources(d.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (isLoading || !user) return null;

    const filtered = resources.filter(r => {
        const matchTab = activeTab === "All" || r.fileType?.toUpperCase() === activeTab.toUpperCase();
        const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.subject?.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    return (
        <LMSShell pageTitle="Resources">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Learning Resources</div>
                        <div className={styles.bannerSub}>Download PDFs, slides, books, and videos for your enrolled courses.</div>
                    </div>
                    <Folder size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.tabs}>
                        {TYPE_TABS.map(tab => (
                            <button
                                key={tab}
                                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className={styles.searchWrapper}>
                        <MagnifyingGlass size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            className={styles.searchInput}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Count */}
                <div className={styles.resultCount}>{filtered.length} resource{filtered.length !== 1 ? "s" : ""} found</div>

                {/* Content */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeleton} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Tray size={52} color="#cbd5e1" />
                        <h3>No Resources Found</h3>
                        <p>Try adjusting your filter or search term.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map((res: any, idx: number) => {
                            const { color, bg } = typeColor(res.fileType);
                            const IconComp = typeIcon(res.fileType);
                            return (
                                <div key={res.id || idx} className={styles.card}>
                                    <div className={styles.cardTopBar} style={{ background: color }} />
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardHead}>
                                            <div className={styles.fileIcon} style={{ background: bg, color }}>
                                                <IconComp size={22} weight="duotone" />
                                            </div>
                                            <div className={styles.fileMeta}>
                                                <div className={styles.fileName}>{res.title}</div>
                                                <span className={styles.fileType} style={{ background: bg, color }}>
                                                    {res.fileType || "FILE"}
                                                </span>
                                            </div>
                                        </div>
                                        {res.subject && (
                                            <div className={styles.subject}>{res.subject}</div>
                                        )}
                                        {res.fileSize && (
                                            <div className={styles.size}>{res.fileSize}</div>
                                        )}
                                        <div className={styles.cardFooter}>
                                            {res.uploadedAt && (
                                                <span className={styles.uploadDate}>
                                                    {new Date(res.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            )}
                                            {res.fileUrl ? (
                                                <a
                                                    href={res.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={styles.downloadBtn}
                                                    style={{ background: color }}
                                                >
                                                    <DownloadSimple size={15} weight="bold" /> Download
                                                </a>
                                            ) : (
                                                <button className={styles.downloadBtn} style={{ background: color }} disabled>
                                                    <DownloadSimple size={15} weight="bold" /> Download
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
