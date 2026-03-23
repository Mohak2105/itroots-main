"use client";

import styles from "./CertificatePreview.module.css";

export type CertificatePreviewRecord = {
    certificateNumber?: string;
    duration?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    signatorySignature?: string | null;
    issueDate?: string;
    student?: { id?: string; name?: string; email?: string };
    course?: { id?: string; title?: string; duration?: string; category?: string };
    batch?: { id?: string; name?: string };
};

const formatDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

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

type Props = {
    certificate: CertificatePreviewRecord;
    className?: string;
};

export default function CertificatePreview({ certificate, className }: Props) {
    return (
        <div className={[styles.canvas, className].filter(Boolean).join(" ")}>
            <div className={styles.inner}>
                <div className={styles.frame} />
                <div className={styles.cornerTop} />
                <div className={styles.cornerTopSecondary} />
                <div className={styles.cornerTopTertiary} />
                <div className={styles.cornerBottom} />
                <div className={styles.logoWrap}>
                    <img src="/images/lms_logo.png" alt="ITROOTS logo" className={styles.logoImage} />
                </div>
                <div className={styles.titleMain}>CERTIFICATE</div>
                <div className={styles.titleSecondary}>OF ACHIEVEMENT</div>
                <div className={styles.ornament}>
                    <span />
                    <i />
                    <span />
                </div>
                <div className={styles.presented}>THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
                <div className={styles.recipient}>{certificate.student?.name || "Student Name"}</div>
                <div className={styles.recipientLine} />
                <div className={styles.statement}>
                    for successfully completing the professional course conducted by ITROOTS
                </div>
                <div className={styles.courseName}>{certificate.course?.title || "Course Title"}</div>
                <div className={styles.metaLine}>Batch: {certificate.batch?.name || "Assigned Batch"}</div>
                <div className={styles.metaLine}>Duration: {certificate.duration || "Not specified"}</div>
                <div className={styles.footer}>
                    <div className={styles.signatureBlock}>
                        {certificate.signatorySignature ? (
                            <div className={styles.signatureImageWrap}>
                                <img
                                    src={resolveAssetUrl(certificate.signatorySignature)}
                                    alt="Signatory e-signature"
                                    className={styles.signatureImage}
                                />
                            </div>
                        ) : (
                            <div className={styles.signatureScript}>{certificate.signatoryName || "Authorized Signatory"}</div>
                        )}
                        <div className={styles.signatureLine} />
                        <div className={styles.signatureRole}>{certificate.signatoryTitle || "Authorized Signatory"}</div>
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
                <div className={styles.metaFooter}>
                    <div>Certificate No: {certificate.certificateNumber || "Will be generated automatically"}</div>
                </div>
            </div>
        </div>
    );
}
