"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    MagnifyingGlass,
    Plus,
    X,
    Trash,
    PencilSimple,
    Tag,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "../students/admin-students.module.css";

interface CourseInfo {
    id: string;
    title: string;
}

interface BatchInfo {
    id: string;
    name: string;
    courseId: string;
    course?: { title: string };
}

interface Teacher {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone: string;
    specialization?: string;
    isActive: boolean;
    createdAt: string;
    courses?: CourseInfo[];
    teacherBatches?: BatchInfo[];
}

interface IssuedCredentials {
    name: string;
    username: string;
    password: string;
}

const EMPTY_FORM = {
    name: "",
    email: "",
    phone: "",
    specialization: "",
    assignedCourseId: "",
    assignedBatchId: "",
};

export default function AdminTeachersPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [batches, setBatches] = useState<BatchInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    const availableBatches = useMemo(
        () => batches.filter((batch) => !formData.assignedCourseId || batch.courseId === formData.assignedCourseId),
        [batches, formData.assignedCourseId]
    );

    const fetchTeachers = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const url = searchQuery
                ? `${ENDPOINTS.ADMIN.TEACHERS}?search=${encodeURIComponent(searchQuery)}`
                : ENDPOINTS.ADMIN.TEACHERS;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTeachers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch teachers failed:", err);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchAcademicData = async () => {
        if (!token) return;
        try {
            const [coursesRes, batchesRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.BATCHES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [coursesData, batchesData] = await Promise.all([coursesRes.json(), batchesRes.json()]);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setBatches(Array.isArray(batchesData) ? batchesData : []);
        } catch (err) {
            console.error("Fetch academic data failed:", err);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchTeachers();
        }
    }, [token, searchQuery]);

    useEffect(() => {
        if (token) {
            void fetchAcademicData();
        }
    }, [token]);

    const resetModal = () => {
        setShowModal(false);
        setSelectedTeacherId(null);
        setFormData(EMPTY_FORM);
    };

    const handleCreateClick = () => {
        setIssuedCredentials(null);
        setSelectedTeacherId(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const handleEditClick = (teacher: Teacher) => {
        setIssuedCredentials(null);
        setSelectedTeacherId(teacher.id);
        setFormData({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || "",
            specialization: teacher.specialization || "",
            assignedCourseId: teacher.courses?.[0]?.id || "",
            assignedBatchId: teacher.teacherBatches?.[0]?.id || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            if (selectedTeacherId) {
                const updateRes = await fetch(`${ENDPOINTS.ADMIN.USERS}/${selectedTeacherId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        specialization: formData.specialization,
                    }),
                });

                if (!updateRes.ok) {
                    throw new Error("Unable to update teacher profile");
                }

                if (formData.assignedCourseId || formData.assignedBatchId) {
                    const assignmentRes = await fetch(ENDPOINTS.ADMIN.TEACHER_ASSIGNMENTS(selectedTeacherId), {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            assignedCourseId: formData.assignedCourseId,
                            assignedBatchId: formData.assignedBatchId,
                        }),
                    });

                    if (!assignmentRes.ok) {
                        const assignmentError = await assignmentRes.json().catch(() => null);
                        throw new Error(assignmentError?.message || "Unable to update teacher assignment");
                    }
                }
            } else {
                const createRes = await fetch(ENDPOINTS.ADMIN.TEACHERS, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                });
                const created = await createRes.json();

                if (!createRes.ok) {
                    throw new Error(created?.message || "Unable to create teacher");
                }

                setIssuedCredentials({
                    name: created?.teacher?.name || formData.name,
                    username: created?.credentials?.username || "",
                    password: created?.credentials?.password || "",
                });
            }

            resetModal();
            await Promise.all([fetchTeachers(), fetchAcademicData()]);
        } catch (err) {
            console.error("Teacher save failed:", err);
            alert(err instanceof Error ? err.message : "Teacher save failed");
        }
    };

    const handleToggleStatus = async (teacherId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${teacherId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                void fetchTeachers();
            }
        } catch (err) {
            console.error("Status toggle failed:", err);
        }
    };

    const handleDeleteTeacher = async (teacherId: string) => {
        if (!confirm("Are you sure you want to delete this teacher permanently?")) return;
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${teacherId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchTeachers();
            }
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Instructor Faculty">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Manage Teachers</h1>
                        <p>Create teacher accounts, optionally assign courses and batches, and manage instructor access.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.searchBox}>
                            <MagnifyingGlass size={20} />
                            <input
                                type="text"
                                placeholder="Search teachers"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.enrollBtn} onClick={handleCreateClick}>
                            <Plus size={18} weight="bold" /> Create Teacher
                        </button>
                    </div>
                </div>

                {issuedCredentials ? (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: "18px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                        <strong>{issuedCredentials.name}</strong> created successfully. Username: <strong>{issuedCredentials.username}</strong> | Password: <strong>{issuedCredentials.password}</strong>
                    </div>
                ) : null}

                <div className={styles.tableWrapper}>
                    <table className={styles.studentTable}>
                        <thead>
                            <tr>
                                <th>INSTRUCTOR</th>
                                <th>SPECIALIZATION</th>
                                <th>COURSE / BATCH</th>
                                <th>JOINED DATE</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>Loading teacher records...</td>
                                </tr>
                            ) : teachers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>No teachers found.</td>
                                </tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td>
                                            <div className={styles.studentInfo}>
                                                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #0881ec, #06b6d4)" }}>
                                                    {teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.name}>{teacher.name}</div>
                                                    <div className={styles.email}>{teacher.username || teacher.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.contact}>{teacher.specialization || "Not assigned"}</div>
                                        </td>
                                        <td>
                                            <div className={styles.batchList}>
                                                {teacher.teacherBatches?.length ? (
                                                    teacher.teacherBatches.map((batch) => (
                                                        <div key={batch.id} className={styles.batchItem}>
                                                            <Tag size={12} /> {batch.course?.title || "Course"} / {batch.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className={styles.unassigned}>No batch assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.date}>{new Date(teacher.createdAt).toISOString().split("T")[0]}</div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleStatus(teacher.id, teacher.isActive)}
                                                className={styles.toggleSwitch}
                                                title={teacher.isActive ? "Click to block" : "Click to activate"}
                                            >
                                                <div className={`${styles.toggleTrack} ${teacher.isActive ? styles.on : styles.off}`}>
                                                    <div className={styles.toggleThumb} />
                                                </div>
                                                <span className={`${styles.toggleLabel} ${!teacher.isActive ? styles.off : ""}`}>
                                                    {teacher.isActive ? "Active" : "Blocked"}
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => handleEditClick(teacher)} className={styles.editBtn} title="Edit teacher">
                                                    <PencilSimple size={18} weight="bold" />
                                                </button>
                                                <button onClick={() => handleDeleteTeacher(teacher.id)} className={styles.deleteBtn} title="Delete teacher">
                                                    <Trash size={18} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{selectedTeacherId ? "Update Teacher" : "Create Teacher"}</h3>
                            <button onClick={resetModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Full Name</label>
                                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Demo Teacher" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="teacher@example.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number</label>
                                <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Specialization</label>
                                <input required value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Full Stack Development" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assigned Course (Optional)</label>
                                <select
                                    value={formData.assignedCourseId}
                                    onChange={(e) => setFormData({ ...formData, assignedCourseId: e.target.value, assignedBatchId: "" })}
                                >
                                    <option value="">Assign later</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assigned Batch (Optional)</label>
                                <select
                                    value={formData.assignedBatchId}
                                    onChange={(e) => setFormData({ ...formData, assignedBatchId: e.target.value })}
                                    disabled={!formData.assignedCourseId}
                                >
                                    <option value="">Assign later</option>
                                    {availableBatches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                {selectedTeacherId ? "Save Teacher" : "Create Teacher Account"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
