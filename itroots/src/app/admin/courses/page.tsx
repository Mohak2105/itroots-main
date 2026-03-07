"use client";

import { useEffect, useState } from "react";
import { useLMSAuth } from "@/app/lms/auth-context";
import { useRouter } from "next/navigation";
import { Plus, PencilSimple, Trash, X, FloppyDisk, BookOpen, CurrencyInr } from "@phosphor-icons/react";
import LMSShell from "@/components/lms/LMSShell";
import heroStyles from "../dashboard/admin-dashboard.module.css";
import { ENDPOINTS } from "@/config/api";

interface TeacherOption {
    id: string;
    name: string;
    specialization?: string;
}

interface CourseForm {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    category: string;
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
    category: "",
    duration: "",
    instructorId: "",
    status: "DRAFT",
};

export default function AdminCoursesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
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
            const [coursesRes, teachersRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.TEACHERS, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [coursesData, teachersData] = await Promise.all([coursesRes.json(), teachersRes.json()]);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
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
            instructorId: teachers[0]?.id || "",
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
            category: course.category || "",
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
            closeModal();
            void fetchData();
        } catch (err) {
            console.error("Save failed:", err);
            alert(err instanceof Error ? err.message : "Save failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.COURSES}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error("Unable to delete course");
            }
            void fetchData();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Course Library">
            <div className={heroStyles.welcome} style={{ marginBottom: "2rem" }}>
                <div>
                    <h2>Course Library</h2>
                    <p>Manage LMS courses, assign instructors, control pricing, and publish course status.</p>
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
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Instructor:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{course.instructor?.name || "Unassigned"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Duration:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{course.duration || "Not set"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Category:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{course.category || "General"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Price:</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <CurrencyInr size={14} /> {Number(course.price || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", minWidth: "72px" }}>Summary:</span>
                                    <span style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                                        {course.description || "No course description added yet."}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                                <button onClick={() => openEditModal(course)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <PencilSimple size={14} /> Edit
                                </button>
                                <button onClick={() => handleDelete(course.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontWeight: 600, fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
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
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Category</label>
                                    <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. AI & ML" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "1rem" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Duration</label>
                                    <input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 12 Weeks" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseForm["status"] })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "#334155" }}>Assign Instructor</label>
                                <select required value={formData.instructorId} onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}>
                                    <option value="">Select a teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.specialization ? ` - ${teacher.specialization}` : ""}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" style={{ marginTop: "1rem", padding: "0.9rem", background: "#0a0f1e", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <FloppyDisk size={18} /> Save Course
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
