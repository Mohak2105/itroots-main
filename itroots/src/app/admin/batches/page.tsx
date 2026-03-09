"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { Calendar, X, Plus, Trash, PencilSimple, UsersThree } from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "../dashboard/admin-dashboard.module.css";

interface CourseInfo {
    id: string;
    title: string;
}

interface BatchRecord {
    id: string;
    name: string;
    courseId: string;
    FacultyId: string;
    schedule: string;
    startDate: string;
    endDate: string;
    course?: { title: string };
    Faculty?: { name: string; specialization?: string };
    students?: Array<{ id: string }>;
}

const EMPTY_BATCH = {
    id: "",
    name: "",
    courseId: "",
    FacultyId: "",
    schedule: "",
    startDate: "",
    endDate: "",
};

const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "Not set");

export default function AdminBatchesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [batches, setBatches] = useState<BatchRecord[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [batchForm, setBatchForm] = useState(EMPTY_BATCH);

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {            const [bRes, cRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.BATCHES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
            setBatches(Array.isArray(bData) ? bData : []);
            setCourses(Array.isArray(cData) ? cData : []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [token]);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    if (isLoading || !user) return null;

    const openCreateModal = () => {
        setBatchForm({
            ...EMPTY_BATCH,
            courseId: courses[0]?.id || "",
            FacultyId: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (batch: BatchRecord) => {
        setBatchForm({
            id: batch.id,
            name: batch.name,
            courseId: batch.courseId || "",
            FacultyId: batch.FacultyId || "",
            schedule: batch.schedule || "",
            startDate: formatDate(batch.startDate),
            endDate: formatDate(batch.endDate),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setBatchForm(EMPTY_BATCH);
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = batchForm.id ? `${ENDPOINTS.ADMIN.BATCHES}/${batchForm.id}` : ENDPOINTS.ADMIN.BATCHES;
            const method = batchForm.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: batchForm.name,
                    courseId: batchForm.courseId,
                    FacultyId: batchForm.FacultyId,
                    schedule: batchForm.schedule,
                    startDate: batchForm.startDate,
                    endDate: batchForm.endDate,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Unable to save batch");
            }

            closeModal();
            void fetchData();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Unable to save batch");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this batch?")) return;
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.BATCHES}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <LMSShell pageTitle="Batch Schedule">
            <div className={styles.pageStack}>
                <div className={styles.welcome}>
                <div>
                    <h2>Batch Schedule</h2>
                    <p>Manage session schedules and cohort timelines.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    style={{ padding: "0.75rem 1.5rem", background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={16} weight="bold" /> Create New Batch
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                {batches.length === 0 ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                        No batches created yet. Click "Create New Batch" to get started.
                    </div>
                ) : (
                    batches.map((batch) => (
                        <div key={batch.id} style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                <div>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#0881ec", background: "rgba(8,129,236,0.1)", padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase" }}>{batch.course?.title || "Unknown Course"}</span>
                                    <h3 style={{ fontFamily: "Outfit", fontSize: "1.2rem", fontWeight: 800, color: "#0a0f1e", marginTop: "0.5rem" }}>{batch.name}</h3>
                                </div>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Calendar size={24} color="#0881ec" />
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Faculty:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{batch.Faculty?.name || "Unassigned"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Schedule:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{batch.schedule || "Not set"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Duration:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(batch.startDate)} to {formatDate(batch.endDate)}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Students:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <UsersThree size={16} color="#0881ec" /> {batch.students?.length || 0}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                                <button onClick={() => openEditModal(batch)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <PencilSimple size={14} /> Edit
                                </button>
                                <button onClick={() => handleDelete(batch.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Trash size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen ? (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", padding: "2rem", borderRadius: "20px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }}>
                        <button onClick={closeModal} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                            <X size={24} weight="bold" />
                        </button>

                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#0a0f1e" }}>{batchForm.id ? "Edit Batch" : "Create New Batch"}</h3>

                        <form onSubmit={handleSaveBatch} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Batch Name</label>
                                <input type="text" required value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="e.g. Full Stack JS Evening" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Select Course</label>
                                <select required value={batchForm.courseId} onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}>
                                    <option value="">Select a course</option>
                                    {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Schedule Timing</label>
                                <input type="text" required value={batchForm.schedule} onChange={(e) => setBatchForm({ ...batchForm, schedule: e.target.value })} placeholder="Mon, Wed, Fri - 7:00 PM" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                            </div>

                            <div style={{ display: "flex", gap: "1rem" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Start Date</label>
                                    <input type="date" required value={batchForm.startDate} onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>End Date</label>
                                    <input type="date" required value={batchForm.endDate} onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                            </div>

                            <button type="submit" style={{ marginTop: "1rem", padding: "0.9rem", background: "#0a0f1e", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
                                {batchForm.id ? "Save Batch" : "Add Batch"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
            </div>
        </LMSShell>
    );
}


