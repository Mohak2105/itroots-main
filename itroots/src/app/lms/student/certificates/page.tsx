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
        if (!token || certificates.length === 0) return;

        const initialCertificate = certificates[0];
        if (!initialCertificate?.id) return;
        if (selectedCertificateId === initialCertificate.id && viewUrl) return;

        let isCancelled = false;

        const loadInitialPreview = async () => {
            setViewLoading(true);
            try {
                const blob = await fetchCertificateBlob(initialCertificate.id);
                if (!blob || isCancelled) return;

                const url = window.URL.createObjectURL(blob);
                setSelectedCertificateId(initialCertificate.id);
                setViewUrl((previousUrl) => {
                    if (previousUrl) {
                        window.URL.revokeObjectURL(previousUrl);
                    }
                    return url;
                });
            } catch (error) {
                console.error("Initial certificate preview failed:", error);
            } finally {
                if (!isCancelled) {
                    setViewLoading(false);
                }
            }
        };

        loadInitialPreview();

        return () => {
            isCancelled = true;
        };
    }, [certificates, token, selectedCertificateId, viewUrl]);

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
            setSelectedCertificateId(certificateId);
            setViewUrl((previousUrl) => {
                if (previousUrl) {
                    window.URL.revokeObjectURL(previousUrl);
                }
                return url;
            });
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
        setSelectedCertificateId(null);
    };

    const buildInlinePreviewUrl = (url: string) =>
        `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit`;

    if (isLoading || !user) return null;

    const selectedCertificate = certificates.find((certificate) => certificate.id === selectedCertificateId) ?? certificates[0] ?? null;

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
                                    <div className={styles.previewMeta}>
                                        <span className={styles.badge}>{new Date(selectedCertificate.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                        <div className={styles.metaLine}>Certificate No: {selectedCertificate.certificateNumber}</div>
                                        <div className={styles.metaLine}>Duration: {selectedCertificate.duration}</div>
                                        
                                    </div>
                                    <div className={styles.previewCanvas}>
                                        {viewUrl && selectedCertificateId === selectedCertificate.id ? (
                                            <iframe
                                                src={buildInlinePreviewUrl(viewUrl)}
                                                className={styles.inlinePreviewFrame}
                                                title="Certificate Preview"
                                                scrolling="no"
                                            />
                                        ) : (
                                            <div className={styles.previewPlaceholder}>
                                                <Scroll size={52} color="#94a3b8" weight="duotone" />
                                                <div className={styles.previewPlaceholderTitle}>{selectedCertificate.course?.title || "Certificate"}</div>
                                                <p>{viewLoading ? "Loading certificate preview..." : "Preview will appear here automatically."}</p>
                                            </div>
                                        )}
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
