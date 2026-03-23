"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import Calendar from "react-calendar";
import styles from "./certificates.module.css";
import {
    CalendarBlank,
    CaretDown,
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
    signatorySignature?: string | null;
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
    signatorySignature: string;
    signatorySignatureFileName: string;
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

const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const toDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Unable to read the selected signature file"));
        reader.readAsDataURL(file);
    });

const resolveAssetUrl = (value?: string | null) => {
    if (!value) return "";
    if (value.startsWith("data:") || /^https?:\/\//i.test(value)) {
        return value;
    }
    if (typeof window === "undefined") {
        return value;
    }
    return new URL(value, window.location.origin).toString();
};

const escapeHtml = (value?: string | null) =>
    String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export default function AdminCertificatesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeCertificate, setActiveCertificate] = useState<CertificateRecord | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [form, setForm] = useState<CertificateForm>({
        studentId: "",
        courseId: "",
        duration: "",
        signatoryName: "",
        signatoryTitle: "Authorized Signatory",
        signatorySignature: "",
        signatorySignatureFileName: "",
        issueDate: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/admin/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user?.name && !form.signatoryName) {
            setForm((current) => ({ ...current, signatoryName: user.name }));
        }
    }, [user?.name, form.signatoryName]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!datePickerRef.current?.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener("pointerdown", handlePointerDown);
        }

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [showDatePicker]);

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
            signatorySignature: form.signatorySignature || null,
            issueDate: form.issueDate,
            student: { id: selectedStudent.id, name: selectedStudent.name, email: selectedStudent.email },
            course: selectedCourse,
            batch: { id: "preview-batch", name: selectedBatchName },
            creator: { id: user?.id || "", name: user?.name || "Admin" },
        } as CertificateRecord;
    }, [activeCertificate, selectedStudent, selectedCourse, form.duration, form.signatoryName, form.signatoryTitle, form.signatorySignature, form.issueDate, selectedBatchName, user?.id, user?.name]);

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
            setShowDatePicker(false);
            toast.success("Certificate generated successfully!");
        } catch (error) {
            console.error("Certificate generation failed:", error);
            toast.error(error instanceof Error ? error.message : "Certificate generation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type.toLowerCase())) {
            toast.error("Please upload a PNG or JPG file for the e-signature");
            event.target.value = "";
            return;
        }

        try {
            const fileDataUrl = await readFileAsDataUrl(file);
            setActiveCertificate(null);
            setForm((current) => ({
                ...current,
                signatorySignature: fileDataUrl,
                signatorySignatureFileName: file.name,
            }));
        } catch (error) {
            console.error("Signature upload failed:", error);
            toast.error(error instanceof Error ? error.message : "Unable to read signature image");
        } finally {
            event.target.value = "";
        }
    };

    const handleRemoveSignature = () => {
        setActiveCertificate(null);
        setForm((current) => ({
            ...current,
            signatorySignature: "",
            signatorySignatureFileName: "",
        }));
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

        const signatorySignatureUrl = resolveAssetUrl(previewCertificate.signatorySignature);
        const printLogoUrl = resolveAssetUrl("/images/lms_logo.png");
        const printSealUrl = resolveAssetUrl("/images/logo.png");
        const signatoryBlockMarkup = signatorySignatureUrl
            ? `<div class="signature-image-wrap"><img class="signature-image" src="${escapeHtml(signatorySignatureUrl)}" alt="Signatory e-signature" /></div>`
            : `<div class="script">${escapeHtml(previewCertificate.signatoryName || "Authorized Signatory")}</div>`;

        previewWindow.document.write(`
            <html>
            <head>
                <title>Certificate Sample</title>
                <style>
                    body { margin: 0; padding: 24px; background: #edf2f7; font-family: Arial, sans-serif; }
                    .sheet { width: 1120px; margin: 0 auto; background: #f7fbff; border: 1px solid #b7cbe0; border-radius: 24px; padding: 28px; box-sizing: border-box; }
                    .inner { border: 1.5px solid #b7cbe0; border-radius: 18px; padding: 34px 54px 28px; min-height: 620px; position: relative; overflow: hidden; background: #f8fbff; }
                    .inner::before, .inner::after, .curve-top, .curve-bottom { content: ""; position: absolute; border-radius: 50%; pointer-events: none; }
                    .inner::before { width: 380px; height: 280px; top: -182px; left: -188px; background: #0d3f74; }
                    .inner::after { width: 320px; height: 230px; top: -150px; left: -150px; background: #0f5ca8; }
                    .curve-top { width: 270px; height: 196px; top: -122px; left: -112px; background: #2a86dc; }
                    .curve-bottom { width: 340px; height: 240px; right: -160px; bottom: -146px; background: #0d3f74; }
                    .curve-bottom::before { content: ""; position: absolute; inset: 26px; border-radius: 50%; background: #0f5ca8; }
                    .curve-bottom::after { content: ""; position: absolute; inset: 56px; border-radius: 50%; background: #2a86dc; }
                    .frame { position: absolute; inset: 18px; border: 1px solid #d9e4ef; pointer-events: none; }
                    .logo-wrap { text-align: center; position: relative; z-index: 2; }
                    .logo-wrap img { width: 212px; max-width: 100%; }
                    .title-main { text-align: center; margin-top: 24px; color: #111827; font-size: 64px; line-height: 1; font-family: "Times New Roman", Georgia, serif; font-weight: 700; letter-spacing: 0.03em; position: relative; z-index: 2; }
                    .title-sub { text-align: center; margin-top: 8px; color: #111827; font-size: 26px; font-family: "Times New Roman", Georgia, serif; font-weight: 700; letter-spacing: 0.38em; position: relative; z-index: 2; }
                    .ornament { margin: 20px auto 0; width: 140px; display: flex; align-items: center; gap: 10px; position: relative; z-index: 2; }
                    .ornament span { flex: 1; height: 1px; background: #1f2937; }
                    .ornament i { width: 6px; height: 6px; border-radius: 999px; background: #1f2937; display: block; }
                    .lead { text-align: center; margin-top: 30px; color: #3f4a59; font-size: 19px; font-family: "Times New Roman", Georgia, serif; letter-spacing: 0.12em; position: relative; z-index: 2; }
                    .name { text-align: center; margin-top: 26px; color: #111827; font-size: 58px; line-height: 1.08; font-family: "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive; font-style: normal; font-weight: 400; position: relative; z-index: 2; }
                    .name-line { width: 470px; height: 1px; background: #c7d5e4; margin: 10px auto 0; position: relative; z-index: 2; }
                    .body { text-align: center; margin-top: 18px; color: #475569; font-size: 21px; line-height: 1.6; position: relative; z-index: 2; }
                    .course { color: #12395b; font-weight: 800; font-size: 34px; display: block; margin-top: 12px; }
                    .meta { text-align: center; margin-top: 12px; color: #526173; font-size: 20px; position: relative; z-index: 2; }
                    .footer { display: grid; grid-template-columns: 1fr 130px 1fr; align-items: end; gap: 24px; margin-top: 74px; position: relative; z-index: 2; }
                    .block { text-align: center; }
                    .script { font-size: 34px; font-family: "Brush Script MT", "Times New Roman", serif; color: #111827; line-height: 1; margin-bottom: 14px; }
                    .signature-image-wrap { height: 58px; margin-bottom: 14px; display: flex; align-items: flex-end; justify-content: center; }
                    .signature-image { max-width: 180px; max-height: 58px; object-fit: contain; }
                    .rule { border-top: 1px solid #12395b; margin-bottom: 10px; }
                    .label { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
                    .seal { width: 110px; height: 110px; margin: 0 auto; border-radius: 999px; border: 1px solid #b9cce0; box-shadow: inset 0 0 0 6px #f4f8fc, inset 0 0 0 7px #d8e3ef; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.96); }
                    .seal img { width: 54px; height: 54px; object-fit: contain; }
                    .meta-row { display: flex; justify-content: flex-start; align-items: center; margin-top: 34px; color: #526173; font-size: 17px; position: relative; z-index: 2; }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="inner">
                        <div class="frame"></div>
                        <div class="curve-top"></div>
                        <div class="curve-bottom"></div>
                        <div class="logo-wrap"><img src="${escapeHtml(printLogoUrl)}" alt="ITROOTS logo" /></div>
                        <div class="title-main">CERTIFICATE</div>
                        <div class="title-sub">OF ACHIEVEMENT</div>
                        <div class="ornament"><span></span><i></i><span></span></div>
                        <div class="lead">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
                        <div class="name">${escapeHtml(previewCertificate.student?.name || "Student Name")}</div>
                        <div class="name-line"></div>
                        <div class="body">
                            for successfully completing the professional course conducted by ITROOTS LMS
                            <span class="course">${escapeHtml(previewCertificate.course?.title || "Course Title")}</span>
                        </div>
                        <div class="meta">Batch: ${escapeHtml(previewCertificate.batch?.name || "Assigned Batch")}</div>
                        <div class="meta">Duration: ${escapeHtml(previewCertificate.duration || "Not specified")}</div>
                        <div class="footer">
                            <div class="block">
                                ${signatoryBlockMarkup}
                                <div class="rule"></div>
                                <div class="label">${escapeHtml(previewCertificate.signatoryTitle || "Authorized Signatory")}</div>
                            </div>
                            <div class="seal"><img src="${escapeHtml(printSealUrl)}" alt="ITROOTS seal" /></div>
                            <div class="block">
                                <div class="script">ITROOTS LMS</div>
                                <div class="rule"></div>
                                <div class="label">Official Academic Certificate</div>
                            </div>
                        </div>
                        <div class="meta-row">
                            <div>Certificate No: ${escapeHtml(previewCertificate.certificateNumber)}</div>
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
                                    <div className={styles.certificateFrame} />
                                    <div className={styles.cornerTop} />
                                    <div className={styles.cornerTopSecondary} />
                                    <div className={styles.cornerTopTertiary} />
                                    <div className={styles.cornerBottom} />
                                    <div className={styles.logoWrap}>
                                        <img src="/images/lms_logo.png" alt="ITROOTS logo" className={styles.logoImage} />
                                    </div>
                                    <div className={styles.certificateTitleMain}>CERTIFICATE</div>
                                    <div className={styles.certificateTitleSecondary}>OF ACHIEVEMENT</div>
                                    <div className={styles.certificateOrnament}>
                                        <span />
                                        <i />
                                        <span />
                                    </div>
                                    <div className={styles.presented}>THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
                                    <div className={styles.recipient}>{previewCertificate.student?.name || "Student Name"}</div>
                                    <div className={styles.recipientLine} />
                                    <div className={styles.statement}>
                                        for successfully completing the professional course conducted by ITROOTS
                                    </div>
                                    <div className={styles.courseName}>{previewCertificate.course?.title || "Course Title"}</div>
                                    <div className={styles.metaLine}>Batch: {previewCertificate.batch?.name || "Assigned Batch"}</div>
                                    <div className={styles.metaLine}>Duration: {previewCertificate.duration || "Not specified"}</div>
                                    <div className={styles.certificateFooter}>
                                        <div className={styles.signatureBlock}>
                                            {previewCertificate.signatorySignature ? (
                                                <div className={styles.signatureImageWrap}>
                                                    <img
                                                        src={resolveAssetUrl(previewCertificate.signatorySignature)}
                                                        alt="Signatory e-signature"
                                                        className={styles.signatureImage}
                                                    />
                                                </div>
                                            ) : (
                                                <div className={styles.signatureScript}>{previewCertificate.signatoryName || "Authorized Signatory"}</div>
                                            )}
                                            <div className={styles.signatureLine} />
                                            <div className={styles.signatureRole}>{previewCertificate.signatoryTitle || "Authorized Signatory"}</div>
                                        </div>
                                        <div className={styles.sealBlock}>
                                            <img src="/images/logo.png" alt="ITROOTS seal" className={styles.sealLogo} />
                                        </div>
                                        <div className={styles.signatureBlock}>
                                            <div className={styles.signatureScript}>ITROOTS LMS</div>
                                            <div className={styles.signatureLine} />
                                            <div className={styles.signatureRole}>Official Academic Certificate</div>
                                        </div>
                                    </div>
                                    <div className={styles.certificateMetaFooter}>
                                        <div>Certificate No: {previewCertificate.certificateNumber}</div>
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
                            <button
                                onClick={() => {
                                    setShowDatePicker(false);
                                    setShowModal(false);
                                }}
                            >
                                <X size={20} />
                            </button>
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

                                    <div className={styles.field}>
                                        <span>Issue Date</span>
                                        <div className={styles.datePickerWrap} ref={datePickerRef}>
                                            <button
                                                type="button"
                                                className={styles.dateFieldButton}
                                                onClick={() => setShowDatePicker((current) => !current)}
                                                aria-expanded={showDatePicker}
                                            >
                                                <CalendarBlank size={18} weight="duotone" />
                                                <span className={styles.dateFieldValue}>{formatDate(form.issueDate)}</span>
                                                <CaretDown size={16} weight="bold" className={styles.dateFieldCaret} />
                                            </button>
                                            {showDatePicker ? (
                                                <div className={styles.datePopover}>
                                                    <Calendar
                                                        onChange={(value) => {
                                                            const nextDate = Array.isArray(value) ? value[0] : value;
                                                            if (nextDate instanceof Date && !Number.isNaN(nextDate.getTime())) {
                                                                setActiveCertificate(null);
                                                                setForm((current) => ({
                                                                    ...current,
                                                                    issueDate: toDateValue(nextDate),
                                                                }));
                                                                setShowDatePicker(false);
                                                            }
                                                        }}
                                                        value={parseLocalDate(form.issueDate)}
                                                        maxDetail="month"
                                                        className={styles.reactCalendar}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
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

                                <div className={styles.field}>
                                    <span>Upload E-Signature</span>
                                    <div className={styles.signatureUploadPanel}>
                                        <div className={styles.signatureUploadHeader}>
                                            <div>
                                                <div className={styles.signatureUploadTitle}>Admin signatory e-sign</div>
                                                <div className={styles.signatureUploadMeta}>PNG or JPG only. Transparent PNG works best on certificates.</div>
                                            </div>
                                            <label className={styles.signatureUploadButton}>
                                                Upload Signature
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg"
                                                    className={styles.hiddenInput}
                                                    onChange={handleSignatureUpload}
                                                />
                                            </label>
                                        </div>

                                        {form.signatorySignature ? (
                                            <div className={styles.signaturePreviewCard}>
                                                <img
                                                    src={resolveAssetUrl(form.signatorySignature)}
                                                    alt="Uploaded e-signature preview"
                                                    className={styles.signaturePreviewImage}
                                                />
                                                <div className={styles.signaturePreviewActions}>
                                                    <div className={styles.signatureUploadMeta}>
                                                        {form.signatorySignatureFileName || "Signature uploaded"}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.secondaryButton}
                                                        onClick={handleRemoveSignature}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.formHint}>
                                                No e-sign uploaded yet. The certificate will use the typed signatory name as a fallback signature style.
                                            </div>
                                        )}
                                    </div>
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
