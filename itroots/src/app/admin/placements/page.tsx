"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import Calendar from "react-calendar";
import {
    CalendarBlank,
    CaretDown,
    MagnifyingGlass,
    Plus,
    X,
    Trash,
    PaperPlaneRight,
    Spinner,
} from "@/components/icons/lucide-phosphor";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import styles from "../students/admin-students.module.css";
import toast from "react-hot-toast";
import { showDeleteConfirmation } from "@/utils/toastUtils";
import { useRef } from "react";
import "react-calendar/dist/Calendar.css";

interface Placement {
    id: string;
    companyName: string;
    designation: string;
    salaryRange: string;
    jobDescription: string;
    passoutYears: string;
    applyLink: string;
    companyLogo?: string;
    dueDate?: string | null;
    createdAt: string;
}

const EMPTY_FORM = {
    companyName: "",
    designation: "",
    salaryRange: "",
    jobDescription: "",
    passoutYears: "",
    applyLink: "",
    companyLogo: "",
    dueDate: "",
};
const isBrowser = typeof window !== "undefined";

const formatDate = (value?: string | null) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const toDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const isPlacementExpired = (placement: Pick<Placement, "dueDate">) => {
    if (!placement.dueDate) return false;
    const dueDate = new Date(placement.dueDate);
    if (Number.isNaN(dueDate.getTime())) return false;
    return dueDate.getTime() < Date.now();
};

const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read logo file"));
        reader.readAsDataURL(file);
    });

const resolveLogoUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/")) {
        return value;
    }
    return `${API_ORIGIN}${value}`;
};

export default function AdminPlacementsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const dueDatePickerRef = useRef<HTMLDivElement>(null);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [logoPreview, setLogoPreview] = useState("");
    const [sendingPlacementId, setSendingPlacementId] = useState<string | null>(null);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!dueDatePickerRef.current?.contains(event.target as Node)) {
                setShowDueDatePicker(false);
            }
        };

        if (showDueDatePicker) {
            document.addEventListener("pointerdown", handlePointerDown);
        }

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [showDueDatePicker]);

    const fetchPlacements = useCallback(async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const res = await fetch(ENDPOINTS.CMS.PLACEMENTS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPlacements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch placements failed:", err);
        } finally {
            setLoadingData(false);
        }
    }, [token]);

    useEffect(() => {
        void fetchPlacements();
    }, [fetchPlacements]);

    const filtered = placements.filter(
        (placement) =>
            !searchQuery
            || placement.companyName.toLowerCase().includes(searchQuery.toLowerCase())
            || placement.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetModal = () => {
        setShowModal(false);
        setFormData(EMPTY_FORM);
        setLogoPreview("");
        setShowDueDatePicker(false);
    };

    const handleCreateClick = () => {
        setFormData(EMPTY_FORM);
        setLogoPreview("");
        setShowDueDatePicker(false);
        setShowModal(true);
    };

    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setFormData((current) => ({ ...current, companyLogo: "" }));
            setLogoPreview("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file for the company logo.");
            event.target.value = "";
            return;
        }

        try {
            const imageData = await readFileAsDataUrl(file);
            setFormData((current) => ({ ...current, companyLogo: imageData }));
            setLogoPreview(imageData);
        } catch (error) {
            console.error("Logo upload failed:", error);
            toast.error(error instanceof Error ? error.message : "Unable to process logo file");
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        try {
            const res = await fetch(ENDPOINTS.CMS.PLACEMENTS, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Failed to save placement");
            }
            resetModal();
            toast.success("Placement saved successfully!");
            await fetchPlacements();
        } catch (err) {
            console.error("Save placement failed:", err);
            toast.error(err instanceof Error ? err.message : "Save failed");
        }
    };

    const handleDelete = (id: string) => {
        showDeleteConfirmation("Placement", async () => {
            const res = await fetch(`${ENDPOINTS.CMS.PLACEMENTS}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                await fetchPlacements();
            }
        });
    };

    const handleSendPlacement = async (placementId: string) => {
        if (!token || sendingPlacementId) return;

        setSendingPlacementId(placementId);
        try {
            const response = await fetch(ENDPOINTS.ADMIN.SEND_PLACEMENT(placementId), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || "Unable to send placement");
            }

            toast.success(`Placement sent to ${data?.recipientCount || 0} students.`);
        } catch (error) {
            console.error("Send placement failed:", error);
            toast.error(error instanceof Error ? error.message : "Unable to send placement");
        } finally {
            setSendingPlacementId(null);
        }
    };

    if (isLoading || !user) return null;

    const compactModalLayout = isBrowser && window.innerWidth <= 640;

    return (
        <LMSShell pageTitle="Placements">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Placements</h1>
                        <p>Manage job placements, drives, due dates.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.searchBox}>
                            <MagnifyingGlass size={20} />
                            <input
                                type="text"
                                placeholder="Search placements"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.enrollBtn} onClick={handleCreateClick}>
                            <Plus size={18} weight="bold" /> Add Placement
                        </button>
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.studentTable}>
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Designation</th>
                                <th>Salary Range</th>
                                <th>Description</th>
                                <th>Passout Years</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Apply Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={9} className={styles.empty}>Loading placement records...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className={styles.empty}>No placements found.</td>
                                </tr>
                            ) : (
                                filtered.map((placement) => {
                                    const logoUrl = resolveLogoUrl(placement.companyLogo);
                                    const expired = isPlacementExpired(placement);
                                    return (
                                        <tr key={placement.id}>
                                            <td>
                                                <div className={styles.studentInfo}>
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt={placement.companyName} style={{ width: 46, height: 46, borderRadius: 14, objectFit: "contain", background: "#f8fafc", border: "1px solid #e2e8f0", flexShrink: 0 }} />
                                                    ) : (
                                                        <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #22c55e, #14b8a6)" }}>
                                                            {placement.companyName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className={styles.name}>{placement.companyName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><div className={styles.tablePrimary}>{placement.designation}</div></td>
                                            <td><div className={styles.tablePrimary}>{placement.salaryRange}</div></td>
                                            <td><div className={styles.tablePrimary} style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{placement.jobDescription}</div></td>
                                            <td><span className={styles.dateBadge}>{placement.passoutYears}</span></td>
                                            <td><span className={styles.dateBadge}>{formatDate(placement.dueDate)}</span></td>
                                            <td>
                                                <span
                                                    className={styles.dateBadge}
                                                    style={expired ? { background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" } : { background: "#ecfdf5", borderColor: "#bbf7d0", color: "#15803d" }}
                                                >
                                                    {expired ? "Expired" : "Open"}
                                                </span>
                                            </td>
                                            <td>
                                                <a href={placement.applyLink} target="_blank" rel="noreferrer" style={{ color: "#0881ec", fontWeight: "bold", textDecoration: "underline", opacity: expired ? 0.55 : 1, pointerEvents: expired ? "none" : "auto" }}>
                                                    {expired ? "Expired" : "Apply"}
                                                </a>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        onClick={() => { void handleSendPlacement(placement.id); }}
                                                        className={styles.mailBtn}
                                                        title={expired ? "Expired placements cannot be sent" : "Send to students"}
                                                        disabled={sendingPlacementId === placement.id || expired}
                                                        style={sendingPlacementId === placement.id || expired ? { opacity: 0.7, cursor: expired ? "not-allowed" : "wait", transform: "none" } : undefined}
                                                    >
                                                        {sendingPlacementId === placement.id ? (
                                                            <Spinner size={18} weight="bold" />
                                                        ) : (
                                                            <PaperPlaneRight size={18} weight="bold" />
                                                        )}
                                                    </button>
                                                    <button onClick={() => handleDelete(placement.id)} className={styles.deleteBtn} title="Delete">
                                                        <Trash size={18} weight="bold" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Add Placement</h3>
                            <button onClick={resetModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div style={{ display: "grid", gridTemplateColumns: compactModalLayout ? "1fr" : "1fr 1fr", gap: compactModalLayout ? "0" : "0 1rem" }}>
                                <div className={styles.formGroup}>
                                    <label>Company Name</label>
                                    <input required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="e.g. Google, Amazon" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Designation</label>
                                    <input required value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Software Engineer" />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: compactModalLayout ? "1fr" : "1fr 1fr", gap: compactModalLayout ? "0" : "0 1rem" }}>
                                <div className={styles.formGroup}>
                                    <label>Salary Range</label>
                                    <input required value={formData.salaryRange} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })} placeholder="e.g. 6-10 LPA" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Passout Years</label>
                                    <input required value={formData.passoutYears} onChange={(e) => setFormData({ ...formData, passoutYears: e.target.value })} placeholder="e.g. 2024, 2025" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Due Date</label>
                                <div className={styles.datePickerWrap} ref={dueDatePickerRef}>
                                    <button
                                        type="button"
                                        className={styles.dateFieldButton}
                                        onClick={() => setShowDueDatePicker((current) => !current)}
                                        aria-expanded={showDueDatePicker}
                                    >
                                        <CalendarBlank size={18} weight="duotone" />
                                        <span className={styles.dateFieldValue}>
                                            {formData.dueDate ? formatDate(formData.dueDate) : "Select due date"}
                                        </span>
                                        <CaretDown size={16} weight="bold" className={styles.dateFieldCaret} />
                                    </button>
                                    {showDueDatePicker ? (
                                        <div className={styles.datePopover}>
                                            <Calendar
                                                onChange={(value) => {
                                                    const nextDate = Array.isArray(value) ? value[0] : value;
                                                    if (nextDate instanceof Date && !Number.isNaN(nextDate.getTime())) {
                                                        setFormData((current) => ({
                                                            ...current,
                                                            dueDate: toDateValue(nextDate),
                                                        }));
                                                        setShowDueDatePicker(false);
                                                    }
                                                }}
                                                value={formData.dueDate ? parseLocalDate(formData.dueDate) : new Date()}
                                                minDate={new Date()}
                                                maxDetail="month"
                                                className={styles.reactCalendar}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Job Description</label>
                                <textarea required value={formData.jobDescription} onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })} placeholder="Roles, responsibilities, requirements..." rows={4} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Apply Link</label>
                                <input required type="url" value={formData.applyLink} onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Upload Company Logo <span style={{ color: "#94a3b8", fontWeight: 500 }}>(Optional)</span></label>
                                <input type="file" accept="image/*" onChange={(event) => { void handleLogoChange(event); }} />
                                <div style={{ marginTop: "0.45rem", fontSize: "0.8rem", color: "#64748b" }}>
                                    Logo size: 200 x 200 px
                                </div>
                                {logoPreview ? (
                                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <img src={logoPreview} alt="Logo preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain", background: "#f8fafc", border: "1px solid #e2e8f0" }} />
                                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Logo preview</span>
                                    </div>
                                ) : null}
                            </div>
                            <button type="submit" className={styles.submitBtn}>Add Job Posting</button>
                        </form>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}
