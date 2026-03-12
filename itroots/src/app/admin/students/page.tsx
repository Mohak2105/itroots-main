"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    MagnifyingGlass,
    Plus,
    X,
    PencilSimple,
    EnvelopeSimple,
} from "@phosphor-icons/react";
import { ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import styles from "./admin-students.module.css";
import toast from "react-hot-toast";
import { showStatusConfirmation } from "@/utils/toastUtils";

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
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    courseId: "",
    batchId: "",
};

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
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

export default function AdminStudentsPage() {
    const { user, isLoading, token, impersonate } = useLMSAuth();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [batches, setBatches] = useState<BatchInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ACTIVE");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    const activeStudents = useMemo(() => students.filter((student) => student.isActive), [students]);
    const inactiveStudents = useMemo(() => students.filter((student) => !student.isActive), [students]);


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

        const nameParts = student.name ? student.name.split(" ") : ["", "", ""];
        const firstName = nameParts[0] || "";
        let middleName = "";
        let lastName = "";

        if (nameParts.length > 2) {
            lastName = nameParts.pop() || "";
            middleName = nameParts.slice(1).join(" ");
        } else if (nameParts.length === 2) {
            lastName = nameParts[1] || "";
        }

        setFormData({
            firstName,
            middleName,
            lastName,
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
                        name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ").trim(),
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
                    body: JSON.stringify({
                        name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ").trim(),
                        email: formData.email,
                        phone: formData.phone,
                        courseId: formData.courseId,
                        batchId: formData.batchId,
                    }),
                });
                const created = await createRes.json();

                if (!createRes.ok) {
                    throw new Error(created?.message || "Unable to create student");
                }

                setIssuedCredentials({
                    name: created?.student?.name || [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ").trim(),
                    username: created?.credentials?.username || "",
                    password: created?.credentials?.password || "",
                    loginWith: created?.credentials?.loginWith || [],
                });
                resetModal();
            }

            await Promise.all([fetchStudents(), fetchAcademicData()]);
            toast.success(isEditing ? "Student updated successfully!" : "Student created successfully!");
        } catch (err) {
            console.error("Student save failed:", err);
            toast.error(err instanceof Error ? err.message : "Student save failed");
        }
    };

    const handleToggleStatus = (studentId: string, currentStatus: boolean) => {
        showStatusConfirmation("Student", currentStatus, async () => {
            const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${studentId}`, {
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
            void fetchStudents();
        });
    };

    const handleImpersonate = async (student: Student) => {
        if (!token) return;
        try {
            const res = await fetch(ENDPOINTS.ADMIN.IMPERSONATE(student.id), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Impersonation failed");
            }
            impersonate(data.user, data.token);
            toast.success(`Logged in as ${data.user.name}`);
            router.push("/lms/student/dashboard");
        } catch (err) {
            console.error("Impersonation error:", err);
            toast.error(err instanceof Error ? err.message : "Impersonation failed");
        }
    };

    const handleSendWelcomeMail = async (student: Student) => {
        if (!token) return;
        try {
            const res = await fetch(ENDPOINTS.ADMIN.SEND_WELCOME_EMAIL(student.id), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Unable to send welcome mail");
            }
            setIssuedCredentials({
                name: data?.user?.name || student.name,
                username: data?.credentials?.username || student.email,
                password: data?.credentials?.password || "",
                loginWith: data?.credentials?.loginWith || [student.email],
            });
            toast.success(`Welcome mail sent to ${data?.user?.email || student.email}`);
        } catch (err) {
            console.error("Welcome mail failed:", err);
            toast.error(err instanceof Error ? err.message : "Unable to send welcome mail");
        }
    };

    const renderRows = (records: Student[]) => {
        if (loadingData) {
            return (
                <tr>
                    <td colSpan={8} className={styles.empty}>Loading student records...</td>
                </tr>
            );
        }

        if (records.length === 0) {
            return (
                <tr>
                    <td colSpan={8} className={styles.empty}>No students found in this list.</td>
                </tr>
            );
        }

        return records.map((student) => {
            const primaryBatch = student.enrolledBatches?.[0];
            const extraBatchCount = Math.max((student.enrolledBatches?.length || 0) - 1, 0);

            return (
                <tr key={student.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <div className={styles.studentInfo}>
                            <div className={styles.avatar}>{getInitials(student.name)}</div>
                            <div>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleImpersonate(student); }} className={styles.nameLink}>
                                    {student.name}
                                </a>
                            </div>
                        </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <span className={styles.tableSecondary}>{primaryBatch?.course?.title || "Unassigned"}</span>
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
                        <span className={styles.tableSecondary}>{student.phone || "No phone"}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <span className={styles.tableSecondary}>{formatDate(student.createdAt)}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <button
                            onClick={() => handleToggleStatus(student.id, student.isActive)}
                            className={styles.toggleSwitch}
                            title={student.isActive ? "Click to set inactive" : "Click to activate"}
                            style={{ transform: "scale(0.8)", transformOrigin: "left center" }}
                        >
                            <div className={`${styles.toggleTrack} ${student.isActive ? styles.on : styles.off}`}>
                                <div className={styles.toggleThumb} />
                            </div>
                            <span className={`${styles.toggleLabel} ${!student.isActive ? styles.off : ""}`}>
                                {student.isActive ? "Active" : "Inactive"}
                            </span>
                        </button>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <div className={styles.actions}>
                            <button onClick={() => handleSendWelcomeMail(student)} className={styles.mailBtn} title="Send welcome mail">
                                <EnvelopeSimple size={18} weight="bold" />
                            </button>
                            <button onClick={() => handleEditClick(student)} className={styles.editBtn} title="Edit student">
                                <PencilSimple size={18} weight="bold" />
                            </button>
                        </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                        <span className={styles.tableSecondary}>{student.email}</span>
                    </td>
                </tr>
            );
        });
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Student Records">
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <h1>Manage Students</h1>
                        <p>Create student accounts and assign courses and batches.</p>
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
                        <div className={styles.statusSelectWrap}>
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                options={[
                                    { value: "ACTIVE", label: `Active Students (${activeStudents.length})` },
                                    { value: "INACTIVE", label: `Inactive Students (${inactiveStudents.length})` },
                                ]}
                            />
                        </div>
                        <button className={styles.enrollBtn} onClick={handleCreateClick}>
                            <Plus size={18} weight="bold" />
                            <span>Create Student</span>
                        </button>
                    </div>
                </div>

                {issuedCredentials ? (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "18px", padding: "1rem 1.25rem" }}>
                        <strong>{issuedCredentials.name}</strong> credentials ready. Username: <strong>{issuedCredentials.username}</strong> | Password: <strong>{issuedCredentials.password}</strong>
                    </div>
                ) : null}

                <section className={styles.tableSection}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.studentTable}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Course</th>
                                            <th>Batch</th>
                                            <th>Contact</th>
                                            <th>{statusFilter === "ACTIVE" ? "Joined Date" : "Inactive Date"}</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderRows(statusFilter === "ACTIVE" ? activeStudents : inactiveStudents)}</tbody>
                                </table>
                            </div>
                        </section>
            </div>

            {showModal ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{isEditing ? "Update Student" : "Create Student"}</h3>
                            <button onClick={resetModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>First Name</label>
                                    <input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Enter First Name" />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Middle Name</label>
                                    <input value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} placeholder="Enter Middle Name" />
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Last Name</label>
                                    <input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Enter Last Name" />
                                </div>
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
                                <label>Assign Course</label>
                                <CustomSelect
                                    options={courses.map((course) => ({ value: course.id, label: course.title }))}
                                    value={formData.courseId}
                                    onChange={(val) => setFormData({ ...formData, courseId: val, batchId: "" })}
                                    placeholder="Select a course"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Assign Batch</label>
                                <CustomSelect
                                    options={availableBatches.map((batch) => ({ value: batch.id, label: batch.name }))}
                                    value={formData.batchId}
                                    onChange={(val) => setFormData({ ...formData, batchId: val })}
                                    placeholder="Select a batch"
                                    required
                                />
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


