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
    EnvelopeSimple,
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

interface Faculty {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone: string;
    specialization?: string;
    isActive: boolean;
    createdAt: string;
    courses?: CourseInfo[];
    FacultyBatches?: BatchInfo[];
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

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

export default function AdminFacultyPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [Faculty, setFaculty] = useState<Faculty[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [batches, setBatches] = useState<BatchInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
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

    const fetchFaculty = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const url = searchQuery
                ? `${ENDPOINTS.ADMIN.Faculty}?search=${encodeURIComponent(searchQuery)}`
                : ENDPOINTS.ADMIN.Faculty;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setFaculty(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch Faculty failed:", err);
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
            void fetchFaculty();
        }
    }, [token, searchQuery]);

    useEffect(() => {
        if (token) {
            void fetchAcademicData();
        }
    }, [token]);

    const resetModal = () => {
        setShowModal(false);
        setSelectedFacultyId(null);
        setFormData(EMPTY_FORM);
    };

    const handleCreateClick = () => {
        setIssuedCredentials(null);
        setSelectedFacultyId(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const handleEditClick = (Faculty: Faculty) => {
        setIssuedCredentials(null);
        setSelectedFacultyId(Faculty.id);
        setFormData({
            name: Faculty.name,
            email: Faculty.email,
            phone: Faculty.phone || "",
            specialization: Faculty.specialization || "",
            assignedCourseId: Faculty.courses?.[0]?.id || "",
            assignedBatchId: Faculty.FacultyBatches?.[0]?.id || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            if (selectedFacultyId) {
                const updateRes = await fetch(`${ENDPOINTS.ADMIN.USERS}/${selectedFacultyId}`, {
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
                    throw new Error("Unable to update Faculty profile");
                }

                if (formData.assignedCourseId || formData.assignedBatchId) {
                    const assignmentRes = await fetch(ENDPOINTS.ADMIN.Faculty_ASSIGNMENTS(selectedFacultyId), {
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
                        throw new Error(assignmentError?.message || "Unable to update Faculty assignment");
                    }
                }
            } else {
                const createRes = await fetch(ENDPOINTS.ADMIN.Faculty, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                });
                const created = await createRes.json();

                if (!createRes.ok) {
                    throw new Error(created?.message || "Unable to create Faculty");
                }

                setIssuedCredentials({
                    name: created?.Faculty?.name || formData.name,
                    username: created?.credentials?.username || "",
                    password: created?.credentials?.password || "",
                });
            }

            resetModal();
            await Promise.all([fetchFaculty(), fetchAcademicData()]);
        } catch (err) {
            console.error("Faculty save failed:", err);
            alert(err instanceof Error ? err.message : "Faculty save failed");
        }
    };

    const handleToggleStatus = async (FacultyId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${FacultyId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                void fetchFaculty();
            }
        } catch (err) {
            console.error("Status toggle failed:", err);
        }
    };

    const handleSendWelcomeMail = async (Faculty: Faculty) => {
        if (!token) return;
        try {
            const res = await fetch(ENDPOINTS.ADMIN.SEND_WELCOME_EMAIL(Faculty.id), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Unable to send welcome mail");
            }
            setIssuedCredentials({
                name: data?.user?.name || Faculty.name,
                username: data?.credentials?.username || Faculty.email,
                password: data?.credentials?.password || "",
                loginWith: data?.credentials?.loginWith || [Faculty.email],
            });
            alert(`Welcome mail sent to ${data?.user?.email || Faculty.email}`);
        } catch (err) {
            console.error("Welcome mail failed:", err);
            alert(err instanceof Error ? err.message : "Unable to send welcome mail");
        }
    };

    const handleDeleteFaculty = async (FacultyId: string) => {
        if (!confirm("Are you sure you want to delete this Faculty permanently?")) return;
        try {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${FacultyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                void fetchFaculty();
            }
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Faculty Faculty">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Manage Faculty</h1>
                        <p>Create Faculty accounts, optionally assign courses and batches, and manage instructor access.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.searchBox}>
                            <MagnifyingGlass size={20} />
                            <input
                                type="text"
                                placeholder="Search Faculty"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.enrollBtn} onClick={handleCreateClick}>
                            <Plus size={18} weight="bold" /> Create Faculty
                        </button>
                    </div>
                </div>

                {issuedCredentials ? (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: "18px", padding: "1rem 1.25rem" }}>
                        <strong>{issuedCredentials.name}</strong> credentials ready. Username: <strong>{issuedCredentials.username}</strong> | Password: <strong>{issuedCredentials.password}</strong>
                    </div>
                ) : null}

                <div className={styles.tableWrapper}>
                    <table className={styles.studentTable}>
                        <thead>
                            <tr>
                                <th>Faculty</th>
                                <th>Contact</th>
                                <th>Specialization</th>
                                <th>Course / Batch</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>Loading Faculty records...</td>
                                </tr>
                            ) : Faculty.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>No Faculty found.</td>
                                </tr>
                            ) : (
                                Faculty.map((Faculty) => {
                                    const primaryBatch = Faculty.FacultyBatches?.[0];
                                    const primaryCourse = Faculty.courses?.[0]?.title || primaryBatch?.course?.title || "Not assigned";
                                    const extraBatchCount = Math.max((Faculty.FacultyBatches?.length || 0) - 1, 0);

                                    return (
                                        <tr key={Faculty.id}>
                                            <td>
                                                <div className={styles.studentInfo}>
                                                    <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #0881ec, #06b6d4)" }}>
                                                        {getInitials(Faculty.name)}
                                                    </div>
                                                    <div>
                                                        <div className={styles.name}>{Faculty.name}</div>
                                                        <div className={styles.email}>{Faculty.username || Faculty.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.tableStack}>
                                                    <div className={styles.tablePrimary}>{Faculty.phone || "No phone"}</div>
                                                    <div className={styles.tableSecondary}>{Faculty.email}</div>
                                                </div>
                                            </td>
                                            <td>
                                                {Faculty.specialization ? (
                                                    <div className={styles.tableStack}>
                                                        <div className={styles.tablePrimary}>{Faculty.specialization}</div>
                                                    </div>
                                                ) : (
                                                    <span className={styles.unassigned}>Not assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                {primaryBatch ? (
                                                    <div className={styles.tableStack}>
                                                        <div className={styles.tablePrimary}>{primaryCourse}</div>
                                                        <div className={styles.tableSecondary}>
                                                            {primaryBatch.name}
                                                            {extraBatchCount > 0 ? ` +${extraBatchCount} more` : ""}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={styles.unassigned}>No batch assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={styles.dateBadge}>{formatDate(Faculty.createdAt)}</span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleStatus(Faculty.id, Faculty.isActive)}
                                                    className={styles.toggleSwitch}
                                                    title={Faculty.isActive ? "Click to block" : "Click to activate"}
                                                >
                                                    <div className={`${styles.toggleTrack} ${Faculty.isActive ? styles.on : styles.off}`}>
                                                        <div className={styles.toggleThumb} />
                                                    </div>
                                                    <span className={`${styles.toggleLabel} ${!Faculty.isActive ? styles.off : ""}`}>
                                                        {Faculty.isActive ? "Active" : "Blocked"}
                                                    </span>
                                                </button>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button onClick={() => handleSendWelcomeMail(Faculty)} className={styles.mailBtn} title="Send welcome mail">
                                                        <EnvelopeSimple size={18} weight="bold" />
                                                    </button>
                                                    <button onClick={() => handleEditClick(Faculty)} className={styles.editBtn} title="Edit Faculty">
                                                        <PencilSimple size={18} weight="bold" />
                                                    </button>
                                                    <button onClick={() => handleDeleteFaculty(Faculty.id)} className={styles.deleteBtn} title="Delete Faculty">
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

            {showModal ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{selectedFacultyId ? "Update Faculty" : "Create Faculty"}</h3>
                            <button onClick={resetModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Full Name</label>
                                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Demo Faculty" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Faculty@example.com" />
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
                                {selectedFacultyId ? "Save Faculty" : "Create Faculty Account"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}

