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
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import styles from "../students/admin-students.module.css";
import toast from "react-hot-toast";
import { showDeleteConfirmation, showStatusConfirmation } from "@/utils/toastUtils";

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
    loginWith?: string[];
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
    const { user, isLoading, token, impersonate } = useLMSAuth();
    const router = useRouter();
    const [Faculty, setFaculty] = useState<Faculty[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [batches, setBatches] = useState<BatchInfo[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ACTIVE");
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
            const url = ENDPOINTS.ADMIN.Faculty;
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
    }, [token]);

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
            toast.success(selectedFacultyId ? "Faculty mapped correctly!" : "Faculty processed correctly!");
            await Promise.all([fetchFaculty(), fetchAcademicData()]);
        } catch (err) {
            console.error("Faculty save failed:", err);
            toast.error(err instanceof Error ? err.message : "Faculty save failed");
        }
    };

    const handleToggleStatus = (FacultyId: string, currentStatus: boolean) => {
        showStatusConfirmation("Faculty", currentStatus, async () => {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${FacultyId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (!res.ok) {
                throw new Error("Status toggle failed");
            }
            void fetchFaculty();
        });
    };

    const handleImpersonate = async (faculty: Faculty) => {
        if (!token) return;
        try {
            const res = await fetch(ENDPOINTS.ADMIN.IMPERSONATE(faculty.id), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Impersonation failed");
            }
            impersonate(data.user, data.token);
            toast.success(`Logged in as ${data.user.name}`);
            router.push("/lms/teacher/dashboard");
        } catch (err) {
            console.error("Impersonation error:", err);
            toast.error(err instanceof Error ? err.message : "Impersonation failed");
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
            toast.success(`Welcome mail sent to ${data?.user?.email || Faculty.email}`);
        } catch (err) {
            console.error("Welcome mail failed:", err);
            toast.error(err instanceof Error ? err.message : "Unable to send welcome mail");
        }
    };

    const handleDeleteFaculty = (FacultyId: string) => {
        showDeleteConfirmation("Faculty", async () => {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${FacultyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error("Deletion failed");
            }
            void fetchFaculty();
        });
    };

    if (isLoading || !user) return null;

    const activeFaculty = Faculty.filter((f) => f.isActive);
    const inactiveFaculty = Faculty.filter((f) => !f.isActive);
    const displayedFaculty = statusFilter === "ACTIVE" ? activeFaculty : inactiveFaculty;

    return (
        <LMSShell pageTitle="Faculty Faculty">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Manage Faculty</h1>
                        <p>Create Faculty accounts, optionally assign courses and batches.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.statusSelectWrap}>
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                options={[
                                    { value: "ACTIVE", label: "Active Faculty", badgeCount: activeFaculty.length },
                                    { value: "INACTIVE", label: "Inactive Faculty", badgeCount: inactiveFaculty.length },
                                ]}
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

                {(() => {
                    const renderFacultyRow = (faculty: Faculty) => {
                        const isActiveSection = statusFilter === "ACTIVE";
                        const primaryBatch = faculty.FacultyBatches?.[0];
                        const primaryCourse = faculty.courses?.[0]?.title || primaryBatch?.course?.title || "Not assigned";
                        const extraBatchCount = Math.max((faculty.FacultyBatches?.length || 0) - 1, 0);

                        return (
                            <tr key={faculty.id}>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <div className={styles.studentInfo}>
                                        <div className={styles.avatar} style={{ background: isActiveSection ? "linear-gradient(135deg, #0881ec, #06b6d4)" : "linear-gradient(135deg, #94a3b8, #64748b)" }}>
                                            {getInitials(faculty.name)}
                                        </div>
                                        <div>
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleImpersonate(faculty); }} className={styles.nameLink}>
                                                {faculty.name}
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <span className={styles.tableSecondary}>{faculty.phone || "No phone"}</span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <span className={styles.tableSecondary}>{faculty.specialization || "Not assigned"}</span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <span className={styles.tableSecondary}>{primaryCourse}</span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    {primaryBatch ? (
                                        <span className={styles.tableSecondary}>
                                            {primaryBatch.name}
                                            {extraBatchCount > 0 ? ` +${extraBatchCount} more` : ""}
                                        </span>
                                    ) : (
                                        <span className={styles.tableSecondary}>No batch assigned</span>
                                    )}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <span className={styles.dateBadge}>{formatDate(faculty.createdAt)}</span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <button
                                        onClick={() => handleToggleStatus(faculty.id, faculty.isActive)}
                                        className={styles.toggleSwitch}
                                        title={faculty.isActive ? "Click to deactivate" : "Click to activate"}
                                    >
                                        <div className={`${styles.toggleTrack} ${faculty.isActive ? styles.on : styles.off}`}>
                                            <div className={styles.toggleThumb} />
                                        </div>
                                        <span className={`${styles.toggleLabel} ${!faculty.isActive ? styles.off : ""}`}>
                                            {faculty.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </button>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleSendWelcomeMail(faculty)} className={styles.mailBtn} title="Send welcome mail">
                                            <EnvelopeSimple size={18} weight="bold" />
                                        </button>
                                        <button onClick={() => handleEditClick(faculty)} className={styles.editBtn} title="Edit Faculty">
                                            <PencilSimple size={18} weight="bold" />
                                        </button>
                                        <button onClick={() => handleDeleteFaculty(faculty.id)} className={styles.deleteBtn} title="Delete Faculty">
                                            <Trash size={18} weight="bold" />
                                        </button>
                                    </div>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <span className={styles.tableSecondary}>{faculty.email}</span>
                                </td>
                            </tr>
                        );
                    };

                    return (
                        <div className={styles.tableSection}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.studentTable}>
                                    <thead>
                                        <tr>
                                            <th>Faculty</th>
                                            <th>Contact</th>
                                            <th>Specialization</th>
                                            <th>Course</th>
                                            <th>Batch</th>
                                            <th>{statusFilter === "ACTIVE" ? "Joined Date" : "Inactive Date"}</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingData ? (
                                            <tr>
                                                <td colSpan={9} className={styles.empty}>Loading Faculty records...</td>
                                            </tr>
                                        ) : displayedFaculty.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className={styles.empty}>No {statusFilter.toLowerCase()} faculty found.</td>
                                            </tr>
                                        ) : (
                                            displayedFaculty.map((f) => renderFacultyRow(f))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}
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
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter Email Address" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone Number</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ padding: "0.7rem 0.75rem", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>+91</span>
                                    <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="98765 43210" style={{ flex: 1 }} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Specialization</label>
                                <input required value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Full Stack Development" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assigned Course (Optional)</label>
                                <CustomSelect
                                    value={formData.assignedCourseId}
                                    onChange={(val) => setFormData({ ...formData, assignedCourseId: val, assignedBatchId: "" })}
                                    placeholder="Assign later"
                                    options={[
                                        { value: "", label: "Assign later" },
                                        ...courses.map((course) => ({ value: course.id, label: course.title })),
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assigned Batch (Optional)</label>
                                <CustomSelect
                                    value={formData.assignedBatchId}
                                    onChange={(val) => setFormData({ ...formData, assignedBatchId: val })}
                                    placeholder="Assign later"
                                    disabled={!formData.assignedCourseId}
                                    options={[
                                        { value: "", label: "Assign later" },
                                        ...availableBatches.map((batch) => ({ value: batch.id, label: batch.name })),
                                    ]}
                                />
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

