"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import { buildStudentContentViewerHref, resolveStudentContentUrl } from "@/utils/studentContentViewer";
import styles from "./resources.module.css";
import {
    FilePdf,
    FilePpt,
    FileText,
    ImageSquare,
    DownloadSimple,
    Eye,
    Tray,
    Folder,
} from "@/components/icons/lucide-phosphor";

const TYPE_TABS = ["All", "Image", "PDF", "PPT", "DOC"];
type StudyMaterialType = "IMAGE" | "PDF" | "PPT" | "DOC";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    IMAGE: { label: "Image", icon: ImageSquare, color: "#16a34a", bg: "#f0fdf4" },
    PDF: { label: "PDF", icon: FilePdf, color: "#dc2626", bg: "#fef2f2" },
    PPT: { label: "PPT", icon: FilePpt, color: "#f59e0b", bg: "#fff7ed" },
    DOC: { label: "DOC", icon: FileText, color: "#2563eb", bg: "#eff6ff" },
    FILE: { label: "File", icon: FileText, color: "#6b7280", bg: "#f8fafc" },
};

const formatDate = (dateValue?: string) => {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
            router.push("/student/login");
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
                        <div className={styles.bannerTitle}>Study Material</div>
                        <div className={styles.bannerSub}>View images, PDFs, slides, and documents for your enrolled courses.</div>
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
                            const normalizedFileType = resource.fileType?.toUpperCase() as StudyMaterialType | undefined;
                            const meta = normalizedFileType && normalizedFileType in TYPE_META
                                ? TYPE_META[normalizedFileType]
                                : TYPE_META.FILE;
                            const IconComp = meta.icon;
                            const rawResourceUrl = resource.fileUrl || resource.contentUrl;
                            const resolvedUrl = resolveStudentContentUrl(rawResourceUrl);
                            const viewerHref = rawResourceUrl
                                ? buildStudentContentViewerHref(rawResourceUrl, resource.title)
                                : "";
                            const previewPdfUrl = normalizedFileType === "PDF" && resolvedUrl
                                ? `${resolvedUrl}${resolvedUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`
                                : "";
                            const description = resource.description || resource.subject || "";

                            return (
                                <article key={resource.id || index} className={styles.studyMaterialCard}>
                                    {resolvedUrl ? (
                                        <Link
                                            href={viewerHref}
                                            className={styles.studyMaterialPreviewLink}
                                            aria-label={`Preview ${resource.title}`}
                                        >
                                            <div
                                                className={`${styles.studyMaterialPreview} ${styles.studyMaterialPreviewClickable} ${normalizedFileType === "PDF" ? styles.studyMaterialPdfPreview : ""}`}
                                                style={{ background: normalizedFileType === "PDF" || normalizedFileType === "IMAGE" ? "#ffffff" : meta.bg }}
                                            >
                                                {normalizedFileType === "PDF" ? (
                                                    <iframe
                                                        title={resource.title}
                                                        src={previewPdfUrl}
                                                        className={styles.studyMaterialFrame}
                                                    />
                                                ) : normalizedFileType === "IMAGE" ? (
                                                    <img
                                                        src={resolvedUrl}
                                                        alt={resource.title}
                                                        className={styles.studyMaterialImage}
                                                    />
                                                ) : (
                                                    <div className={styles.studyMaterialFallback} style={{ color: meta.color }}>
                                                        <IconComp size={42} weight="duotone" />
                                                        <span>{meta.label} Preview</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ) : (
                                        <div
                                            className={`${styles.studyMaterialPreview} ${normalizedFileType === "PDF" ? styles.studyMaterialPdfPreview : ""}`}
                                            style={{ background: normalizedFileType === "PDF" || normalizedFileType === "IMAGE" ? "#ffffff" : meta.bg }}
                                        >
                                            <div className={styles.studyMaterialFallback} style={{ color: meta.color }}>
                                                <IconComp size={42} weight="duotone" />
                                                <span>{meta.label} Preview</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.studyMaterialBody}>
                                        <div className={styles.studyMaterialTitle}>{resource.title}</div>
                                        {description ? (
                                            <div className={styles.studyMaterialDesc}>{description}</div>
                                        ) : null}
                                        <div className={styles.studyMaterialMeta}>
                                            <span className={styles.fileType} style={{ background: meta.bg, color: meta.color }}>
                                                {meta.label}
                                            </span>
                                            {resource.uploadedAt ? (
                                                <span className={styles.uploadDate}>{formatDate(resource.uploadedAt)}</span>
                                            ) : null}
                                        </div>
                                        <div className={styles.studyMaterialActions}>
                                            {viewerHref ? (
                                                <Link href={viewerHref} className={`${styles.actionBtn} ${styles.previewBtn}`}>
                                                    <Eye size={16} weight="bold" />
                                                    Preview
                                                </Link>
                                            ) : (
                                                <button type="button" className={`${styles.actionBtn} ${styles.actionDisabled}`} disabled>
                                                    <Eye size={16} weight="bold" />
                                                    Preview
                                                </button>
                                            )}

                                            {resolvedUrl ? (
                                                <a
                                                    href={resolvedUrl}
                                                    className={`${styles.actionBtn} ${styles.downloadBtn}`}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <DownloadSimple size={16} weight="bold" />
                                                    Download
                                                </a>
                                            ) : (
                                                <button type="button" className={`${styles.actionBtn} ${styles.actionDisabled}`} disabled>
                                                    <DownloadSimple size={16} weight="bold" />
                                                    Download
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
