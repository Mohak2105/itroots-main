"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";
import styles from "./certificates.module.css";
import { DownloadSimple, Scroll, SealCheck } from "@phosphor-icons/react";

export default function StudentCertificatesPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

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

    const handleDownload = async (certificateId: string) => {
        if (!token) return;
        try {
            const response = await fetch(ENDPOINTS.STUDENT.CERTIFICATE_DOWNLOAD(certificateId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error("Unable to download certificate");
            }

            const blob = await response.blob();
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

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Certificates">
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div>
                        <p className={styles.eyebrow}>My Achievements</p>
                        <h1>Issued certificates</h1>
                        <p>Download your course completion certificates in PDF format from the LMS.</p>
                    </div>
                    <div className={styles.heroIcon}>
                        <SealCheck size={44} weight="duotone" />
                    </div>
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
                                <button type="button" className={styles.downloadButton} onClick={() => handleDownload(certificate.id)}>
                                    <DownloadSimple size={18} /> Download PDF
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
