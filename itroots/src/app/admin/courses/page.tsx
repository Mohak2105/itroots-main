"use client";

import { useEffect, useState } from "react";
import { useLMSAuth } from "@/app/lms/auth-context";
import { useRouter } from "next/navigation";
import { Plus, PencilSimple, Trash, X, FloppyDisk, BookOpen, CurrencyInr } from "@phosphor-icons/react";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import LMSShell from "@/components/lms/LMSShell";
import heroStyles from "../dashboard/admin-dashboard.module.css";
import { ENDPOINTS } from "@/config/api";
import toast from "react-hot-toast";
import { showDeleteConfirmation } from "@/utils/toastUtils";

interface CourseForm {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    duration: string;
    instructorId: string;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
}

const EMPTY_FORM: CourseForm = {
    id: "",
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    duration: "",
    instructorId: "",
    status: "DRAFT",
};

const DURATION_OPTIONS = ["1 Month", "2 Months", "3 Months", "4 Months", "6 Months", "9 Months", "12 Months"];

export default function AdminCoursesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<CourseForm>(EMPTY_FORM);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    const fetchData = async () => {
        if (!token) return;
        try {
            const coursesRes = await fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } });
            const coursesData = await coursesRes.json();
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (err) {
            console.error("Course fetch failed:", err);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [token]);

    const openCreateModal = () => {
        setFormData({
            ...EMPTY_FORM,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (course: any) => {
        setFormData({
            id: course.id || "",
            title: course.title || "",
            description: course.description || "",
            thumbnail: course.thumbnail || "",
            price: Number(course.price || 0),
            duration: course.duration || "",
            instructorId: course.instructorId || course.instructor?.id || "",
            status: course.status || (course.isPublished ? "ACTIVE" : "DRAFT"),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = formData.id ? `${ENDPOINTS.ADMIN.COURSES}/${formData.id}` : ENDPOINTS.ADMIN.COURSES;
        const method = formData.id ? "PUT" : "POST";

        const loadToast = toast.loading("Saving course...");
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Unable to save course");
            }
            toast.dismiss(loadToast);
            toast.success("Course saved successfully!");
            closeModal();
            void fetchData();
        } catch (err) {
            console.error("Save failed:", err);
            toast.dismiss(loadToast);
            toast.error(err instanceof Error ? err.message : "Save failed");
        }
    };

    const handleDelete = (id: string) => {
        showDeleteConfirmation("Course", async () => {
            const res = await fetch(`${ENDPOINTS.ADMIN.COURSES}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error("Unable to delete course");
            }
            void fetchData();
        });
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Course Library">
            <div className={heroStyles.pageStack}>
                <div className={heroStyles.welcome}>
                    <div>
                        <h2>Course Library</h2>
                        <p>Manage LMS courses, control pricing, and publish course status.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "rgba(255, 255, 255, 0.15)",
                            backdropFilter: "blur(8px)",
                            color: "#fff",
                            border: "1px solid rgba(255, 255, 255, 0.25)",
                            borderRadius: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Plus size={16} weight="bold" /> Create New Course
                    </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                    {courses.length === 0 ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                            No courses created yet. Click "Create New Course" to get started.
                        </div>
                    ) : (
                        courses.map((course: any) => (
                            <div key={course.id} style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                    <div>
                                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: course.status === "ACTIVE" ? "#0881ec" : course.status === "ARCHIVED" ? "#7c3aed" : "#b45309", background: course.status === "ACTIVE" ? "rgba(8,129,236,0.1)" : course.status === "ARCHIVED" ? "rgba(124,58,237,0.12)" : "rgba(180,83,9,0.12)", padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase" }}>
                                            {course.status || "DRAFT"}
                                        </span>
                                        <h3 style={{ fontFamily: "Outfit", fontSize: "1.2rem", fontWeight: 800, color: "#0a0f1e", marginTop: "0.5rem" }}>{course.title}</h3>
                                    </div>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <BookOpen size={24} color="#0881ec" />
                                    </div>
                                </div>

                                {course.thumbnail ? (
                                    <div style={{ width: "100%", height: "150px", borderRadius: "16px", overflow: "hidden", marginBottom: "1rem", background: "#e2e8f0" }}>
                                        <img src={course.thumbnail} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                ) : null}

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Duration:</span>
                                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{course.duration || "Not set"}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Price:</span>
                                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                            <CurrencyInr size={14} /> {Number(course.price || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Description:</span>
                                        <span style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                                            {course.description || "No course description added yet."}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                                    <button onClick={() => openEditModal(course)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", color: "#ffffff", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)" }}>
                                        <PencilSimple size={14} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(course.id)} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "#ffffff", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 4px 10px rgba(239, 68, 68, 0.2)" }}>
                                        <Trash size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isModalOpen ? (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
                        <div style={{ background: "#fff", padding: "2rem", borderRadius: "20px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }}>
                            <button onClick={closeModal} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                                <X size={24} weight="bold" />
                            </button>

                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#0a0f1e" }}>
                                {formData.id ? "Edit Course" : "Create New Course"}
                            </h3>

                            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Course Title</label>
                                    <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Master Data Science" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>

                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Price</label>
                                        <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value || 0) })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Duration</label>
                                        <CustomSelect
                                            options={[
                                                ...DURATION_OPTIONS.map((opt) => ({ value: opt, label: opt })),
                                                ...(formData.duration && !DURATION_OPTIONS.includes(formData.duration) ? [{ value: formData.duration, label: formData.duration }] : []),
                                            ]}
                                            value={formData.duration}
                                            onChange={(val) => setFormData({ ...formData, duration: val })}
                                            placeholder="Select duration"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter course description..."
                                        rows={4}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem 1rem",
                                            borderRadius: "10px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.9rem",
                                            boxSizing: "border-box",
                                            resize: "vertical",
                                            fontFamily: "inherit",
                                            lineHeight: 1.5,
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Status</label>
                                    <CustomSelect
                                        options={[
                                            { value: "DRAFT", label: "Draft" },
                                            { value: "ACTIVE", label: "Active" },
                                            { value: "ARCHIVED", label: "Archived" },
                                        ]}
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as CourseForm["status"] })}
                                        placeholder="Select status"
                                    />
                                </div>

                                <button type="submit" style={{ marginTop: "1rem", padding: "0.9rem", background: "linear-gradient(135deg, #0c2d4c 0%, #0881ec 100%)", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
                                    <FloppyDisk size={18} /> Save Course
                                </button>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
        </LMSShell>
    );
}


