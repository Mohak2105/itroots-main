"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import LMSShell from "@/components/lms/LMSShell";
import { useLMSAuth } from "@/app/lms/auth-context";
import { ENDPOINTS } from "@/config/api";
import {
    UploadSimple,
    FolderOpen, ArrowRight, Plus, X, CaretDown, MagnifyingGlass,
    PlayCircle, FilePdf, File, CheckSquare, Spinner,
} from "@phosphor-icons/react";
import styles from "./content.module.css";

type Batch = { id: string; name: string; courseId?: string; course?: { id: string; title: string } };

type Content = {
    id: string;
    title: string;
    type: "VIDEO" | "DOCUMENT" | "RESOURCE" | "ASSIGNMENT";
    description?: string;
    contentUrl?: string;
    createdAt: string;
    batch?: { name: string };
};

const TABS = ["ALL", "VIDEO", "DOCUMENT", "RESOURCE", "ASSIGNMENT"] as const;
type Tab = typeof TABS[number];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    VIDEO:      { label: "Video",      icon: PlayCircle,  color: "#0881ec", bg: "#eff6ff" },
    DOCUMENT:   { label: "Document",   icon: FilePdf,     color: "#dc2626", bg: "#fef2f2" },
    RESOURCE:   { label: "Resource",   icon: File,        color: "#7c3aed", bg: "#faf5ff" },
    ASSIGNMENT: { label: "Assignment", icon: CheckSquare, color: "#d97706", bg: "#fff7ed" },
};

function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TeacherContent() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();

    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>("");

    const [contents, setContents] = useState<Content[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [tab, setTab] = useState<Tab>("ALL");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        type: "VIDEO" as Content["type"],
        description: "",
        contentUrl: "",
        batchId: "",
        courseId: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.Faculty.MY_BATCHES, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const list: Batch[] = Array.isArray(data) ? data : (data.batches ?? []);
                setBatches(list);
                if (list.length > 0) setSelectedBatch(list[0].id);
            })
            .catch(console.error);
    }, [token]);

    const courses = useMemo(() => {
        const seen = new Map<string, { id: string; title: string }>();
        batches.forEach(b => {
            if (b.course?.id && !seen.has(b.course.id)) {
                seen.set(b.course.id, b.course);
            }
        });
        return Array.from(seen.values());
    }, [batches]);

    const filteredBatches = useMemo(
        () => batches.filter(b => !form.courseId || b.courseId === form.courseId),
        [batches, form.courseId]
    );

    useEffect(() => {
        if (!token || !selectedBatch) return;
        setLoadingContent(true);
        fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${selectedBatch}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => setContents(Array.isArray(data.contents) ? data.contents : []))
            .catch(console.error)
            .finally(() => setLoadingContent(false));
    }, [token, selectedBatch]);

    const filtered = contents.filter(c => {
        const matchTab = tab === "ALL" || c.type === tab;
        const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    function openModal() {
        const defaultBatch = batches.find(b => b.id === selectedBatch);
        setForm({
            title: "",
            type: "VIDEO",
            description: "",
            contentUrl: "",
            batchId: selectedBatch,
            courseId: defaultBatch?.courseId || defaultBatch?.course?.id || "",
        });
        setFile(null);
        setUploadError(null);
        setShowModal(true);
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
        setUploading(true);
        setUploadError(null);

        try {
            const body: Record<string, any> = {
                batchId: form.batchId || selectedBatch,
                title: form.title,
                type: form.type,
                description: form.description,
            };

            if (form.type === "VIDEO") {
                body.contentUrl = form.contentUrl;
            } else if (file) {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(",")[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                body.fileData = base64;
                body.fileName = file.name;
            }

            const res = await fetch(ENDPOINTS.Faculty.ADD_CONTENT, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Upload failed");

            setShowModal(false);
            setLoadingContent(true);
            const refreshed = await fetch(`${ENDPOINTS.Faculty.BATCH_DATA}/${selectedBatch}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const refreshedData = await refreshed.json();
            setContents(Array.isArray(refreshedData.contents) ? refreshedData.contents : []);
        } catch (err: any) {
            setUploadError(err.message || "Something went wrong");
        } finally {
            setUploading(false);
            setLoadingContent(false);
        }
    }

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Video Lectures">
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Video Lectures & Content</h1>
                        <p className={styles.subtitle}>Upload videos, documents, and resources for your batches.</p>
                    </div>
                    <button className={styles.uploadBtn} onClick={openModal}>
                        <Plus size={18} weight="bold" /> Upload Content
                    </button>
                </div>

                <div className={styles.controls}>
                    <div className={styles.batchSelect}>
                        <label className={styles.batchLabel}>Batch</label>
                        <div className={styles.selectWrap}>
                            <select
                                className={styles.select}
                                value={selectedBatch}
                                onChange={e => setSelectedBatch(e.target.value)}
                            >
                                {batches.length === 0 && <option value="">No batches</option>}
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} {b.course?.title ? `(${b.course.title})` : ""}</option>
                                ))}
                            </select>
                            <CaretDown size={14} className={styles.selectIcon} />
                        </div>
                    </div>

                    <div className={styles.searchWrap}>
                        <MagnifyingGlass size={16} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search content..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.tabs}>
                    {TABS.map(t => (
                        <button
                            key={t}
                            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                            onClick={() => setTab(t)}
                        >
                            {t === "ALL" ? "All" : TYPE_META[t].label}
                            {t !== "ALL" && (
                                <span className={styles.tabCount}>
                                    {contents.filter(c => c.type === t).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={styles.contentSection}>
                    {loadingContent ? (
                        <div className={styles.skeletonWrap}>
                            {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.empty}>
                            <FolderOpen size={48} color="#cbd5e1" weight="duotone" />
                            <p>{search ? "No results match your search." : "No content uploaded yet for this batch."}</p>
                            {!search && (
                                <button className={styles.emptyUploadBtn} onClick={openModal}>
                                    <Plus size={15} weight="bold" /> Upload First Content
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.contentList}>
                            {filtered.map(item => {
                                const meta = TYPE_META[item.type] ?? TYPE_META.RESOURCE;
                                const Icon = meta.icon;
                                return (
                                    <div key={item.id} className={styles.contentCard}>
                                        <div className={styles.contentIcon} style={{ background: meta.bg, color: meta.color }}>
                                            <Icon size={22} weight="duotone" />
                                        </div>
                                        <div className={styles.contentInfo}>
                                            <div className={styles.contentTitle}>{item.title}</div>
                                            {item.description && (
                                                <div className={styles.contentDesc}>{item.description}</div>
                                            )}
                                            <div className={styles.contentMeta}>
                                                <span className={styles.contentType} style={{ background: meta.bg, color: meta.color }}>
                                                    {meta.label}
                                                </span>
                                                <span className={styles.contentDate}>{fmt(item.createdAt)}</span>
                                            </div>
                                        </div>
                                        {item.contentUrl && (
                                            <a href={item.contentUrl} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                                                {item.type === "VIDEO" ? "Watch" : "View"} <ArrowRight size={13} />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Upload Content</span>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleUpload}>
                            {uploadError && (
                                <div className={styles.modalError}>{uploadError}</div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <div>
                                    <label className={styles.fieldLabel}>Select Course</label>
                                    <div className={styles.selectWrap}>
                                        <select
                                            className={styles.select}
                                            value={form.courseId}
                                            onChange={e => setForm(f => ({ ...f, courseId: e.target.value, batchId: "" }))}
                                        >
                                            <option value="">All Courses</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                        <CaretDown size={14} className={styles.selectIcon} />
                                    </div>
                                </div>
                                <div>
                                    <label className={styles.fieldLabel}>Select Batch *</label>
                                    <div className={styles.selectWrap}>
                                        <select
                                            className={styles.select}
                                            value={form.batchId}
                                            onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select batch</option>
                                            {filteredBatches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <CaretDown size={14} className={styles.selectIcon} />
                                    </div>
                                </div>
                            </div>

                            <label className={styles.fieldLabel}>Title *</label>
                            <input
                                className={styles.input}
                                placeholder="e.g. Introduction to React Hooks"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                required
                            />

                            <label className={styles.fieldLabel}>Type *</label>
                            <div className={styles.typeGrid}>
                                {(["VIDEO", "DOCUMENT", "RESOURCE", "ASSIGNMENT"] as const).map(t => {
                                    const m = TYPE_META[t];
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ""}`}
                                            style={form.type === t ? { borderColor: m.color, background: m.bg, color: m.color } : {}}
                                            onClick={() => { setForm(f => ({ ...f, type: t })); setFile(null); }}
                                        >
                                            <Icon size={18} weight="duotone" />
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <label className={styles.fieldLabel}>Description</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Brief description of this content..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                            />

                            {form.type === "VIDEO" ? (
                                <>
                                    <label className={styles.fieldLabel}>Video URL *</label>
                                    <input
                                        className={styles.input}
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={form.contentUrl}
                                        onChange={e => setForm(f => ({ ...f, contentUrl: e.target.value }))}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <label className={styles.fieldLabel}>File *</label>
                                    <div
                                        className={styles.dropZone}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {file ? (
                                            <span className={styles.fileName}>{file.name}</span>
                                        ) : (
                                            <>
                                                <UploadSimple size={24} color="#94a3b8" />
                                                <span>Click to select file</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        style={{ display: "none" }}
                                        accept={form.type === "DOCUMENT" ? ".pdf,.doc,.docx,.ppt,.pptx" : "*"}
                                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                                    />
                                </>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                                    {uploading ? <Spinner size={16} className={styles.spinner} /> : <UploadSimple size={16} />}
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
