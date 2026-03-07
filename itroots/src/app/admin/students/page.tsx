"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    MagnifyingGlass,
    Plus,
    Tag,
    X,
    Trash,
    PencilSimple,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import styles from "./admin-students.module.css";

interface CourseInfo {
    id: string;
    title: string;
}

interface BatchInfo {
    id: string;
    name: string;
    courseId: string;
    schedule?: string;
    course?: { title: string };
}

interface Student {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
    enrolledBatches: BatchInfo[];
}

interface IssuedCredentials {
    name: string;
    username: string;
    password: string;
    loginWith: string[];
}

const EMPTY_FORM = {
    name: "",
    email: "",
    phone: "",
    courseId: "",
    batchId: "",
};

export default function AdminStudentsPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [batches, setBatches] = useState<BatchInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    const availableBatches = useMemo(
        () => batches.filter((batch) => !formData.courseId || batch.courseId === formData.courseId),
        [batches, formData.courseId]
    );

    const fetchStudents = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const url = searchQuery
                ? `${ENDPOINTS.ADMIN.STUDENTS}?search=${encodeURIComponent(searchQuery)}`
                : ENDPOINTS.ADMIN.STUDENTS;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch students failed:", err);
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
            void fetchStudents();
        }
    }, [token, searchQuery]);

    useEffect(() => {
        if (token) {
            void fetchAcademicData();
        }
    }, [token]);

    const resetModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setSelectedStudentId(null);
        setFormData(EMPTY_FORM);
    };

    const handleCreateClick = () => {
        setIssuedCredentials(null);
        setFormData(EMPTY_FORM);
        setIsEditing(false);
        setSelectedStudentId(null);
        setShowModal(true);
    };

    const handleEditClick = (student: Student) => {
        const primaryBatch = student.enrolledBatches?.[0];
        setIssuedCredentials(null);
        setIsEditing(true);
        setSelectedStudentId(student.id);
        setFormData({
            name: student.name,
            email: student.email,
            phone: student.phone || "",
            courseId: primaryBatch?.courseId || "",
            batchId: primaryBatch?.id || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            if (isEditing && selectedStudentId) {
                const updateRes = await fetch(`${ENDPOINTS.ADMIN.USERS}/${selectedStudentId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                    }),
                });

                if (!updateRes.ok) {
                    throw new Error("Unable to update student profile");
                }

                if (formData.courseId || formData.batchId) {
                    const assignmentRes = await fetch(ENDPOINTS.ADMIN.STUDENT_ASSIGNMENTS(selectedStudentId), {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            courseId: formData.courseId || undefined,
                            batchId: formData.batchId || undefined,
                        }),
                    });

                    if (!assignmentRes.ok) {
                        const assignmentError = await assignmentRes.json().catch(() => null);
                        throw new Error(assignmentError?.message || "Unable to update student assignment");
                    }
                }

                resetModal();
            } else {
                const createRes = await fetch(ENDPOINTS.ADMIN.STUDENTS, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                });
                const created = await createRes.json();

                if (!createRes.ok) {
                    throw new Error(created?.message || "Unable to create student");
                }

                setIssuedCredentials({
                    name: created?.student?.name || formData.name,
                    username: created?.credentials?.username || "",
                    password: created?.credentials?.password || "",
                    loginWith: created?.credentials?.loginWith || [],
                });
                resetModal();
            }

            await Promise.all([fetchStudents(), fetchAcademicData()]);
        } catch (err) {
            console.error("Student save failed:", err);
            alert(err instanceof Error ? err.message : "Student save failed");
        }
    };

    const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${studentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                void fetchStudents();
            }
        } catch (err) {
            console.error("Status toggle failed:", err);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm("Are you sure you want to delete this student permanently?")) return;
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${studentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchStudents();
            }
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Student Records">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Manage Students</h1>
                        <p>Create student accounts, assign courses and batches, and manage LMS access.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.searchBox}>
                            <MagnifyingGlass size={20} />
                            <input
                                type="text"
                                placeholder="Search students"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.enrollBtn} onClick={handleCreateClick}>
                            <Plus size={18} weight="bold" /> Create Student
                        </button>
                    </div>
                </div>

                {issuedCredentials ? (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "18px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                        <strong>{issuedCredentials.name}</strong> created successfully. Username: <strong>{issuedCredentials.username}</strong> | Password: <strong>{issuedCredentials.password}</strong>
                    </div>
                ) : null}

                <div className={styles.tableWrapper}>
                    <table className={styles.studentTable}>
                        <thead>
                            <tr>
                                <th>STUDENT</th>
                                <th>COURSE / BATCH</th>
                                <th>CONTACT</th>
                                <th>JOINED DATE</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>Loading student records...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>No student records matched your query.</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className={styles.studentInfo}>
                                                <div className={styles.avatar}>{student.name.charAt(0)}</div>
                                                <div>
                                                    <div className={styles.name}>{student.name}</div>
                                                    <div className={styles.email}>{student.username || student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.batchList}>
                                                {student.enrolledBatches?.length > 0 ? (
                                                    student.enrolledBatches.map((batch) => (
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
                                            <div className={styles.contact}>{student.phone || "Not provided"}</div>
                                        </td>
                                        <td>
                                            <div className={styles.date}>{new Date(student.createdAt).toISOString().split("T")[0]}</div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleStatus(student.id, student.isActive)}
                                                className={styles.toggleSwitch}
                                                title={student.isActive ? "Click to block" : "Click to activate"}
                                            >
                                                <div className={`${styles.toggleTrack} ${student.isActive ? styles.on : styles.off}`}>
                                                    <div className={styles.toggleThumb} />
                                                </div>
                                                <span className={`${styles.toggleLabel} ${!student.isActive ? styles.off : ""}`}>
                                                    {student.isActive ? "Active" : "Blocked"}
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => handleEditClick(student)} className={styles.editBtn} title="Edit student">
                                                    <PencilSimple size={18} weight="bold" />
                                                </button>
                                                <button onClick={() => handleDeleteStudent(student.id)} className={styles.deleteBtn} title="Delete student">
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
                            <h3>{isEditing ? "Update Student" : "Create Student"}</h3>
                            <button onClick={resetModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Full Name</label>
                                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="student@example.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number</label>
                                <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assign Course</label>
                                <select
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value, batchId: "" })}
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assign Batch</label>
                                <select
                                    value={formData.batchId}
                                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                    disabled={!formData.courseId}
                                >
                                    <option value="">Select a batch</option>
                                    {availableBatches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                {isEditing ? "Save Student" : "Create Student Account"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
