"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./certificates.module.css";
import { DownloadSimple, Eye, Scroll, SealCheck, X } from "@phosphor-icons/react";

export default function StudentCertificatesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [viewUrl, setViewUrl] = useState<string | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;
        fetch(ENDPOINTS.STUDENT.CERTIFICATES, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => setCertificates(Array.isArray(data) ? data : []))
            .catch((error) => console.error("Certificate fetch failed:", error))
            .finally(() => setLoadingData(false));
    }, [token]);

    const fetchCertificateBlob = async (certificateId: string) => {
        if (!token) return null;
        const response = await fetch(ENDPOINTS.STUDENT.CERTIFICATE_DOWNLOAD(certificateId), {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Unable to fetch certificate");
        return response.blob();
    };

    const handleDownload = async (certificateId: string) => {
        try {
            const blob = await fetchCertificateBlob(certificateId);
            if (!blob) return;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "certificate.pdf";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to download certificate");
        }
    };

    const handleView = async (certificateId: string) => {
        setViewLoading(true);
        try {
            const blob = await fetchCertificateBlob(certificateId);
            if (!blob) return;
            const url = window.URL.createObjectURL(blob);
            setViewUrl(url);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to view certificate");
        } finally {
            setViewLoading(false);
        }
    };

    const closeViewer = () => {
        if (viewUrl) {
            window.URL.revokeObjectURL(viewUrl);
            setViewUrl(null);
        }
    };

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Certificates">
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div>
                        <h1>Certificates</h1>
                        <p>Download your course completion certificates.</p>
                    </div>
                    <SealCheck size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </section>

                {loadingData ? (
                    <div className={styles.emptyState}>Loading certificates...</div>
                ) : certificates.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Scroll size={46} color="#94a3b8" weight="duotone" />
                        <h3>No certificates yet</h3>
                        <p>Your issued certificates will appear here once the admin publishes them.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {certificates.map((certificate) => (
                            <article key={certificate.id} className={styles.card}>
                                <div className={styles.cardTop}>
                                    <div className={styles.badge}>{new Date(certificate.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                                    <Scroll size={22} color="#0f4c81" />
                                </div>
                                <h3>{certificate.course?.title || "Course Certificate"}</h3>
                                <p className={styles.number}>{certificate.certificateNumber}</p>
                                <div className={styles.meta}>Duration: {certificate.duration}</div>
                                <div className={styles.meta}>Batch: {certificate.batch?.name || "Assigned Batch"}</div>
                                <div className={styles.meta}>Signed by: {certificate.signatoryName}</div>
                                <div className={styles.cardActions}>
                                    <button type="button" className={styles.viewButton} onClick={() => handleView(certificate.id)}>
                                        <Eye size={18} /> View
                                    </button>
                                    <button type="button" className={styles.downloadButton} onClick={() => handleDownload(certificate.id)}>
                                        <DownloadSimple size={18} /> Download
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {viewUrl && (
                <div className={styles.viewerOverlay} onClick={closeViewer}>
                    <div className={styles.viewerModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.viewerHeader}>
                            <span className={styles.viewerTitle}>Certificate Preview</span>
                            <button type="button" className={styles.viewerClose} onClick={closeViewer}>
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <iframe src={`${viewUrl}#toolbar=0&navpanes=0`} className={styles.viewerFrame} title="Certificate Preview" />
                    </div>
                </div>
            )}

            {viewLoading && (
                <div className={styles.viewerOverlay}>
                    <div className={styles.viewerLoading}>Loading certificate...</div>
                </div>
            )}
        </LMSShell>
    );
}
