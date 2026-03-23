"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import CertificatePreview, { type CertificatePreviewRecord } from "@/components/certificates/CertificatePreview";
import { ENDPOINTS } from "@/config/api";
import styles from "./certificates.module.css";
import { DownloadSimple, Scroll, SealCheck } from "@phosphor-icons/react";

type CertificateRecord = CertificatePreviewRecord & {
    id: string;
};

export default function StudentCertificatesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
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

    useEffect(() => {
        if (certificates.length === 0) {
            setSelectedCertificateId(null);
            return;
        }

        const hasSelectedCertificate = certificates.some((certificate) => certificate.id === selectedCertificateId);
        if (!selectedCertificateId || !hasSelectedCertificate) {
            setSelectedCertificateId(certificates[0].id);
        }
    }, [certificates, selectedCertificateId]);

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

    const selectedCertificate = certificates.find((certificate) => certificate.id === selectedCertificateId) ?? certificates[0] ?? null;

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
                    <>
                        {selectedCertificate ? (
                            <section className={styles.previewCard}>
                                <div className={styles.previewHeader}>
                                    <div>
                                        <div className={styles.previewLabel}>Certificate Preview</div>
                                        <h2>{selectedCertificate.course?.title || "Course Certificate"}</h2>
                                        <p>Preview the issued certificate first, then download the PDF for your records.</p>
                                    </div>
                                    <div className={styles.previewActions}>
                                        
                                        <button type="button" className={styles.downloadButton} onClick={() => handleDownload(selectedCertificate.id)}>
                                            <DownloadSimple size={18} /> Download
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.previewBody}>
                                    <div className={styles.previewCanvas}>
                                        <CertificatePreview certificate={selectedCertificate} />
                                    </div>
                                </div>
                            </section>
                        ) : null}
                    </>
                )}
            </div>
        </LMSShell>
    );
}
