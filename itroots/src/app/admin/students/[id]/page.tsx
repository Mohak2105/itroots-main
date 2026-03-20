"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LMSShell from "@/components/lms/LMSShell";
import { useLMSAuth } from "@/app/lms/auth-context";
import { ENDPOINTS } from "@/config/api";
import styles from "./student-profile.module.css";

type StudentDetail = {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    enrolledBatches?: Array<{
        id: string;
        name: string;
        schedule?: string;
        course?: { id: string; title: string; duration?: string; price?: number };
        Faculty?: { id: string; name: string; email: string; specialization?: string };
    }>;
    payments?: Array<{
        id: string;
        amount: number;
        status: string;
        paymentDate: string;
        course?: { id: string; title: string };
        batch?: { id: string; name: string };
    }>;
    certificates?: Array<{
        id: string;
        certificateNumber: string;
        issueDate: string;
        course?: { id: string; title: string };
        batch?: { id: string; name: string };
    }>;
};

type DetailResponse = {
    user: StudentDetail;
    summary: {
        totalPaid: number;
        totalCourseFees: number;
        pendingFees: number;
        totalCertificates: number;
        totalBatches: number;
    };
};

const formatDate = (value?: string) => {
    if (!value) return "Not available";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (value?: number) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const getInitials = (name?: string) =>
    (name || "Student")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

export default function AdminStudentProfilePage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [data, setData] = useState<DetailResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token || !studentId) return;
            setLoading(true);
            try {
                const response = await fetch(ENDPOINTS.ADMIN.USER_DETAIL(studentId), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result?.message || "Unable to fetch student profile");
                }
                setData(result);
            } catch (error) {
                console.error("Student profile fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchProfile();
    }, [token, studentId]);

    const student = data?.user;
    const summary = data?.summary;

    const recentPayments = useMemo(() => (student?.payments || []).slice(0, 5), [student?.payments]);
    const recentCertificates = useMemo(() => (student?.certificates || []).slice(0, 5), [student?.certificates]);

    if (isLoading || !user) return null;

    if (loading) {
        return (
            <LMSShell pageTitle="Student Profile">
                <div className={styles.loading}>Loading student profile...</div>
            </LMSShell>
        );
    }

    if (!student || !summary) {
        return (
            <LMSShell pageTitle="Student Profile">
                <div className={styles.emptyState}>Student profile not found.</div>
            </LMSShell>
        );
    }

    return (
        <LMSShell pageTitle="Student Profile">
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1>{student.name}</h1>
                        <p>Admin view of the student profile, enrolled batches, fee status, and certificate history.</p>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/admin/students" className={styles.backLink}>Back to Students</Link>
                    </div>
                </section>

                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{summary.totalBatches}</div>
                        <div className={styles.statLabel}>Assigned Batches</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{formatCurrency(summary.totalPaid)}</div>
                        <div className={styles.statLabel}>Fees Paid</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{formatCurrency(summary.pendingFees)}</div>
                        <div className={styles.statLabel}>Pending Fees</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{summary.totalCertificates}</div>
                        <div className={styles.statLabel}>Certificates</div>
                    </div>
                </section>

                <div className={styles.mainGrid}>
                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>Profile Summary</div>
                        <div className={styles.panelBody}>
                            <div className={styles.profileStack}>
                                <div className={styles.avatar}>{getInitials(student.name)}</div>
                                <div>
                                    <div className={styles.profileName}>{student.name}</div>
                                    <div className={styles.profileMeta}>{student.username || student.email}</div>
                                </div>
                                <span className={`${styles.statusBadge} ${student.isActive ? styles.statusActive : styles.statusInactive}`}>
                                    {student.isActive ? "Active" : "Inactive"}
                                </span>
                                <div className={styles.kvList}>
                                    <div className={styles.kvRow}>
                                        <span className={styles.kvLabel}>Email</span>
                                        <span className={styles.kvValue}>{student.email}</span>
                                    </div>
                                    <div className={styles.kvRow}>
                                        <span className={styles.kvLabel}>Phone</span>
                                        <span className={styles.kvValue}>{student.phone || "Not provided"}</span>
                                    </div>
                                    <div className={styles.kvRow}>
                                        <span className={styles.kvLabel}>Joined On</span>
                                        <span className={styles.kvValue}>{formatDate(student.createdAt)}</span>
                                    </div>
                                    <div className={styles.kvRow}>
                                        <span className={styles.kvLabel}>Total Course Fees</span>
                                        <span className={styles.kvValue}>{formatCurrency(summary.totalCourseFees)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>Enrolled Batches</div>
                        <div className={styles.tableWrapper}>
                            {(student.enrolledBatches || []).length === 0 ? (
                                <div className={styles.emptyState}>No batches assigned.</div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Batch</th>
                                            <th>Faculty</th>
                                            <th>Schedule</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(student.enrolledBatches || []).map((batch) => (
                                            <tr key={batch.id}>
                                                <td>
                                                    <div className={styles.primaryText}>{batch.course?.title || "Course"}</div>
                                                    <div className={styles.secondaryText}>{batch.course?.duration || "Duration not set"}</div>
                                                </td>
                                                <td>
                                                    <div className={styles.primaryText}>{batch.name}</div>
                                                </td>
                                                <td>
                                                    <div className={styles.primaryText}>{batch.Faculty?.name || "Unassigned"}</div>
                                                    <div className={styles.secondaryText}>{batch.Faculty?.specialization || batch.Faculty?.email || ""}</div>
                                                </td>
                                                <td>
                                                    <div className={styles.primaryText}>{batch.schedule || "Not set"}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>Recent Payments</div>
                    <div className={styles.tableWrapper}>
                        {recentPayments.length === 0 ? (
                            <div className={styles.emptyState}>No payments recorded.</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Batch</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td><div className={styles.primaryText}>{payment.course?.title || "Course"}</div></td>
                                            <td><div className={styles.primaryText}>{payment.batch?.name || "Assigned Batch"}</div></td>
                                            <td><div className={styles.primaryText}>{formatCurrency(payment.amount)}</div></td>
                                            <td><div className={styles.primaryText}>{payment.status}</div></td>
                                            <td><div className={styles.primaryText}>{formatDate(payment.paymentDate)}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>Certificates</div>
                    <div className={styles.tableWrapper}>
                        {recentCertificates.length === 0 ? (
                            <div className={styles.emptyState}>No certificates issued yet.</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Certificate No</th>
                                        <th>Course</th>
                                        <th>Batch</th>
                                        <th>Issue Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentCertificates.map((certificate) => (
                                        <tr key={certificate.id}>
                                            <td><div className={styles.primaryText}>{certificate.certificateNumber}</div></td>
                                            <td><div className={styles.primaryText}>{certificate.course?.title || "Course"}</div></td>
                                            <td><div className={styles.primaryText}>{certificate.batch?.name || "Assigned Batch"}</div></td>
                                            <td><div className={styles.primaryText}>{formatDate(certificate.issueDate)}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </LMSShell>
    );
}
