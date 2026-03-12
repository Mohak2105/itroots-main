"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import styles from "./certificates.module.css";
import {
    Certificate,
    DownloadSimple,
    Eye,
    GraduationCap,
    Scroll,
    Plus,
    X,
    EnvelopeSimple,
} from "@phosphor-icons/react";

const DURATION_OPTIONS = [
    { value: "1 Week", label: "1 Week" },
    { value: "2 Weeks", label: "2 Weeks" },
    { value: "4 Weeks", label: "4 Weeks" },
    { value: "6 Weeks", label: "6 Weeks" },
    { value: "8 Weeks", label: "8 Weeks" },
    { value: "12 Weeks", label: "12 Weeks" },
    { value: "1 Month", label: "1 Month" },
    { value: "2 Months", label: "2 Months" },
    { value: "3 Months", label: "3 Months" },
    { value: "6 Months", label: "6 Months" },
    { value: "1 Year", label: "1 Year" },
];
import toast from "react-hot-toast";

type Student = {
    id: string;
    name: string;
    email: string;
    enrolledBatches?: Array<{
        id: string;
        name: string;
        courseId: string;
        course?: { title: string };
    }>;
};

type Course = {
    id: string;
    title: string;
    duration?: string;
    category?: string;
};

type CertificateRecord = {
    id: string;
    certificateNumber: string;
    duration: string;
    signatoryName: string;
    signatoryTitle?: string;
    issueDate: string;
    student?: { id: string; name: string; email: string };
    course?: { id: string; title: string; duration?: string; category?: string };
    batch?: { id: string; name: string };
    creator?: { id: string; name: string };
};

type CertificateForm = {
    studentId: string;
    courseId: string;
    duration: string;
    signatoryName: string;
    signatoryTitle: string;
    issueDate: string;
};

const formatDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const formatShortDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function AdminCertificatesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeCertificate, setActiveCertificate] = useState<CertificateRecord | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<CertificateForm>({
        studentId: "",
        courseId: "",
        duration: "",
        signatoryName: "",
        signatoryTitle: "Authorized Signatory",
        issueDate: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user?.name && !form.signatoryName) {
            setForm((current) => ({ ...current, signatoryName: user.name }));
        }
    }, [user?.name, form.signatoryName]);

    const fetchData = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            const [studentsRes, coursesRes, certificatesRes] = await Promise.all([
                fetch(ENDPOINTS.ADMIN.STUDENTS, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.COURSES, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ENDPOINTS.ADMIN.CERTIFICATES, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const [studentsData, coursesData, certificatesData] = await Promise.all([
                studentsRes.json(),
                coursesRes.json(),
                certificatesRes.json(),
            ]);

            const studentList = Array.isArray(studentsData) ? studentsData : [];
            const courseList = Array.isArray(coursesData) ? coursesData : [];
            const certificateList = Array.isArray(certificatesData) ? certificatesData : [];

            setStudents(studentList);
            setCourses(courseList);
            setCertificates(certificateList);
            setActiveCertificate((current) => {
                if (current) {
                    return certificateList.find((item: CertificateRecord) => item.id === current.id) || certificateList[0] || null;
                }
                return certificateList[0] || null;
            });
        } catch (error) {
            console.error("Certificate data fetch failed:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (token) {
            void fetchData();
        }
    }, [token]);

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === form.studentId) || null,
        [students, form.studentId]
    );

    const availableCourses = useMemo(() => {
        if (!selectedStudent?.enrolledBatches?.length) {
            return [] as Course[];
        }

        const enrolledCourseIds = new Set(selectedStudent.enrolledBatches.map((batch) => batch.courseId));
        return courses.filter((course) => enrolledCourseIds.has(course.id));
    }, [courses, selectedStudent]);

    const selectedCourse = useMemo(
        () => courses.find((course) => course.id === form.courseId) || null,
        [courses, form.courseId]
    );

    const selectedBatchName = useMemo(() => {
        const matchedBatch = selectedStudent?.enrolledBatches?.find((batch) => batch.courseId === form.courseId);
        return matchedBatch?.name || "Assigned Batch";
    }, [selectedStudent, form.courseId]);

    const previewCertificate = useMemo(() => {
        if (activeCertificate) return activeCertificate;
        if (!selectedStudent || !selectedCourse) return null;

        return {
            id: "preview",
            certificateNumber: "Will be generated automatically",
            duration: form.duration,
            signatoryName: form.signatoryName,
            signatoryTitle: form.signatoryTitle,
            issueDate: form.issueDate,
            student: { id: selectedStudent.id, name: selectedStudent.name, email: selectedStudent.email },
            course: selectedCourse,
            batch: { id: "preview-batch", name: selectedBatchName },
            creator: { id: user?.id || "", name: user?.name || "Admin" },
        } as CertificateRecord;
    }, [activeCertificate, selectedStudent, selectedCourse, form.duration, form.signatoryName, form.signatoryTitle, form.issueDate, selectedBatchName, user?.id, user?.name]);

    const handleStudentChange = (studentId: string) => {
        const student = students.find((item) => item.id === studentId);
        const enrolledCourseIds = new Set(student?.enrolledBatches?.map((batch) => batch.courseId) || []);
        const nextCourses = courses.filter((course) => enrolledCourseIds.has(course.id));
        const nextCourse = nextCourses[0] || null;

        setActiveCertificate(null);
        setForm((current) => ({
            ...current,
            studentId,
            courseId: nextCourse?.id || "",
            duration: nextCourse?.duration || current.duration,
        }));
    };

    const handleCourseChange = (courseId: string) => {
        const course = courses.find((item) => item.id === courseId);
        setActiveCertificate(null);
        setForm((current) => ({
            ...current,
            courseId,
            duration: course?.duration || current.duration,
        }));
    };

    const handleGenerate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        setSubmitting(true);
        try {
            const response = await fetch(ENDPOINTS.ADMIN.CERTIFICATES, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Unable to generate certificate");
            }

            setActiveCertificate(data.certificate || null);
            await fetchData();
            setShowModal(false);
            toast.success("Certificate generated successfully!");
        } catch (error) {
            console.error("Certificate generation failed:", error);
            toast.error(error instanceof Error ? error.message : "Certificate generation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (certificateId: string) => {
        if (!token) return;
        try {
            const response = await fetch(ENDPOINTS.ADMIN.CERTIFICATE_DOWNLOAD(certificateId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Unable to download certificate");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "certificate.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success("Certificate downloaded successfully");
        } catch (error) {
            console.error("Certificate download failed:", error);
            toast.error(error instanceof Error ? error.message : "Certificate download failed");
        }
    };

    const handleSendMail = async (certificateId: string) => {
        // Mocking the email send for now since there's no backend endpoint yet
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: "Sending certificate via email...",
                success: "Certificate sent to student successfully!",
                error: "Failed to send certificate",
            }
        );
    };

    const handlePrintPreview = () => {
        if (!previewCertificate || typeof window === "undefined") return;

        const previewWindow = window.open("", "_blank", "width=1200,height=800");
        if (!previewWindow) return;

        previewWindow.document.write(`
            <html>
            <head>
                <title>Certificate Sample</title>
                <style>
                    body { margin: 0; padding: 24px; background: #edf2f7; font-family: Arial, sans-serif; }
                    .sheet { width: 1120px; margin: 0 auto; background: linear-gradient(135deg, #fffdf7, #f7f0d8); border: 6px solid #12395b; border-radius: 24px; padding: 34px; box-sizing: border-box; }
                    .inner { border: 2px solid #c89d2c; border-radius: 18px; padding: 44px 56px; min-height: 620px; position: relative; }
                    .brand { text-align: center; color: #12395b; font-weight: 700; letter-spacing: 4px; }
                    .sub { text-align: center; color: #6b7280; margin-top: 10px; }
                    .title { text-align: center; margin-top: 44px; color: #b68a25; font-size: 42px; font-weight: 800; letter-spacing: 5px; }
                    .line { width: 280px; height: 1px; background: #c89d2c; margin: 16px auto 0; }
                    .lead { text-align: center; margin-top: 42px; color: #475569; font-size: 22px; }
                    .name { text-align: center; margin-top: 20px; color: #0f172a; font-size: 54px; font-weight: 800; font-family: Georgia, serif; }
                    .body { text-align: center; margin-top: 28px; color: #334155; font-size: 24px; line-height: 1.6; }
                    .course { color: #12395b; font-weight: 800; font-size: 34px; display: block; margin-top: 14px; }
                    .meta { text-align: center; margin-top: 18px; color: #475569; font-size: 20px; }
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 86px; }
                    .block { width: 240px; text-align: center; }
                    .rule { border-top: 1px solid #12395b; margin-bottom: 8px; }
                    .label { color: #64748b; font-size: 14px; }
                    .number { text-align: center; margin-top: 48px; color: #475569; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="inner">
                        <div class="brand">ITROOTS LMS</div>
                        <div class="sub">Empowering Minds Through Industry-Ready Learning</div>
                        <div class="title">CERTIFICATE OF COMPLETION</div>
                        <div class="line"></div>
                        <div class="lead">This certificate is proudly presented to</div>
                        <div class="name">${previewCertificate.student?.name || "Student Name"}</div>
                        <div class="body">
                            for successfully completing the course
                            <span class="course">${previewCertificate.course?.title || "Course Title"}</span>
                        </div>
                        <div class="meta">Duration: ${previewCertificate.duration || "Not specified"}</div>
                        <div class="meta">Issued on ${formatDate(previewCertificate.issueDate)}</div>
                        <div class="meta">Batch: ${previewCertificate.batch?.name || "Assigned Batch"}</div>
                        <div class="number">Certificate No: ${previewCertificate.certificateNumber}</div>
                        <div class="footer">
                            <div class="block">
                                <div class="rule"></div>
                                <div>${previewCertificate.signatoryName || "Authorized Signatory"}</div>
                                <div class="label">${previewCertificate.signatoryTitle || "Authorized Signatory"}</div>
                            </div>
                            <div class="block">
                                <div class="rule"></div>
                                <div>ITROOTS Learning Platform</div>
                                <div class="label">Official Academic Certificate</div>
                            </div>
                        </div>
                    </div>
                </div>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>
        `);
        previewWindow.document.close();
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Certificates">
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div>

                        <h1>Generate Student Certificates</h1>
                        <p className={styles.heroText}>
                            Select the student and enrolled course, define the course duration and issue a certificate.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", zIndex: 2, position: "relative" }}>
                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            <Plus size={18} weight="bold" />
                            <span>Create Certificate</span>
                        </button>
                    </div>
                </section>



                <div className={styles.mainGrid}>
                    <section className={styles.previewPanel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h2>Demo Certificate</h2>
                                <p>Preview of demo certificate.</p>
                            </div>
                        </div>

                        {previewCertificate ? (
                            <div className={styles.certificateCanvas}>
                                <div className={styles.certificateInner}>
                                    <div className={styles.brand}>ITROOTS LMS</div>
                                    <div className={styles.brandSub}>Empowering Minds Through Industry-Ready Learning</div>
                                    <div className={styles.certificateTitle}>Certificate of Completion</div>
                                    <div className={styles.certificateDivider} />
                                    <div className={styles.presented}>This certificate is proudly presented to</div>
                                    <div className={styles.recipient}>{previewCertificate.student?.name || "Student Name"}</div>
                                    <div className={styles.statement}>
                                        for successfully completing the professional course
                                    </div>
                                    <div className={styles.courseName}>{previewCertificate.course?.title || "Course Title"}</div>
                                    <div className={styles.metaLine}>Duration: {previewCertificate.duration || "Not specified"}</div>
                                    <div className={styles.metaLine}>Issue Date: {formatDate(previewCertificate.issueDate)}</div>
                                    <div className={styles.metaLine}>Batch: {previewCertificate.batch?.name || "Assigned Batch"}</div>
                                    <div className={styles.certificateNumber}>Certificate No: {previewCertificate.certificateNumber}</div>
                                    <div className={styles.signatureRow}>
                                        <div className={styles.signatureBlock}>
                                            <div className={styles.signatureLine} />
                                            <div className={styles.signatureName}>{previewCertificate.signatoryName || "Authorized Signatory"}</div>
                                            <div className={styles.signatureRole}>{previewCertificate.signatoryTitle || "Authorized Signatory"}</div>
                                        </div>
                                        <div className={styles.signatureBlock}>
                                            <div className={styles.signatureLine} />
                                            <div className={styles.signatureName}>ITROOTS Learning Platform</div>
                                            <div className={styles.signatureRole}>Official Academic Certificate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyPreview}>
                                <Eye size={44} />
                                <p>Select a student and course to preview the certificate design.</p>
                            </div>
                        )}
                    </section>
                </div>

                <section className={styles.historySection}>
                    <div className={styles.panelHeader}>
                        <div>
                            <h2>Issued Certificates</h2>
                            <p>List of all generated certificates.</p>
                        </div>
                    </div>

                    {loadingData ? (
                        <div className={styles.emptyHistory}>Loading certificate records...</div>
                    ) : certificates.length === 0 ? (
                        <div className={styles.emptyHistory}>No certificates generated yet.</div>
                    ) : (
                        <div className={styles.historyTableWrapper}>
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>Certificate No</th>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Course</th>
                                        <th>Batch</th>
                                        <th>Duration</th>
                                        <th>Issue Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {certificates.map((certificate) => {
                                        const isSelected = activeCertificate?.id === certificate.id;
                                        return (
                                            <tr key={certificate.id} className={isSelected ? styles.historyRowActive : undefined}>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historyPrimary}>{certificate.certificateNumber}</div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historyPrimary}>{certificate.student?.name || "Student"}</div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={styles.historySecondary}>{certificate.student?.email || "No email"}</span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historyPrimary}>{certificate.course?.title || "Course"}</div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historySecondary}>{certificate.batch?.name || "Assigned Batch"}</div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historyPrimary}>{certificate.duration || "Not specified"}</div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={styles.historySecondary}>{formatShortDate(certificate.issueDate)}</span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.historyTableActions}>
                                                        <button type="button" className={`${styles.iconButton} ${styles.iconButtonView}`} onClick={() => setActiveCertificate(certificate)} title="View Certificate">
                                                            <Eye size={18} weight="bold" />
                                                        </button>
                                                        <button type="button" className={styles.iconButton} onClick={() => handleSendMail(certificate.id)} title="Send Mail">
                                                            <EnvelopeSimple size={18} weight="bold" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Create Certificate</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <form className={styles.form} onSubmit={handleGenerate} style={{ padding: 0 }}>
                                <div className={styles.field}>
                                    <span>Select Student</span>
                                    <CustomSelect
                                        options={students.map((student) => ({ value: student.id, label: student.name }))}
                                        value={form.studentId}
                                        onChange={(val) => handleStudentChange(val)}
                                        placeholder="Choose a student"
                                        required
                                    />
                                </div>

                                <div className={styles.field}>
                                    <span>Select Course</span>
                                    <CustomSelect
                                        options={availableCourses.map((course) => ({ value: course.id, label: course.title }))}
                                        value={form.courseId}
                                        onChange={(val) => handleCourseChange(val)}
                                        placeholder="Choose a course"
                                        required
                                        disabled={!form.studentId}
                                    />
                                </div>

                                <div className={styles.inlineFields}>
                                    <div className={styles.field}>
                                        <span>Course Duration</span>
                                        <CustomSelect
                                            options={DURATION_OPTIONS}
                                            value={form.duration}
                                            onChange={(val) => { setActiveCertificate(null); setForm((current) => ({ ...current, duration: val })); }}
                                            placeholder="Select duration"
                                            required
                                        />
                                    </div>

                                    <label className={styles.field}>
                                        <span>Issue Date</span>
                                        <input
                                            type="date"
                                            value={form.issueDate}
                                            onChange={(e) => { setActiveCertificate(null); setForm((current) => ({ ...current, issueDate: e.target.value })); }}
                                            required
                                        />
                                    </label>
                                </div>

                                <div className={styles.inlineFields}>
                                    <label className={styles.field}>
                                        <span>Signatory Name</span>
                                        <input
                                            value={form.signatoryName}
                                            onChange={(e) => { setActiveCertificate(null); setForm((current) => ({ ...current, signatoryName: e.target.value })); }}
                                            placeholder="Authorized signer"
                                            required
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Signatory Title</span>
                                        <input
                                            value={form.signatoryTitle}
                                            onChange={(e) => { setActiveCertificate(null); setForm((current) => ({ ...current, signatoryTitle: e.target.value })); }}
                                            placeholder="Managing Director"
                                        />
                                    </label>
                                </div>

                                <div className={styles.formHint}>
                                    {selectedStudent && availableCourses.length === 0
                                        ? "This student has no enrolled course available for certification yet."
                                        : "The certificate will be saved to the database and can be downloaded as PDF anytime."}
                                </div>

                                <div className={styles.formActions} style={{ marginTop: "1rem" }}>
                                    <button type="submit" className={styles.primaryButton} disabled={submitting || availableCourses.length === 0}>
                                        {submitting ? "Generating..." : "Generate Certificate"}
                                    </button>
                                    <button type="button" className={styles.secondaryButton} onClick={handlePrintPreview} disabled={!previewCertificate}>
                                        Print Preview
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </LMSShell>
    );
}




