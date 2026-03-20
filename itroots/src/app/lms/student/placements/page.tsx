"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import styles from "./placements.module.css";
import {
    Briefcase,
    CalendarDots,
    CurrencyCircleDollar,
    ArrowSquareOut,
    Tray,
    Trophy,
} from "@phosphor-icons/react";

type PlacementRecord = {
    id: string;
    companyName: string;
    designation: string;
    salaryRange: string;
    jobDescription: string;
    passoutYears: string;
    applyLink: string;
    companyLogo?: string;
    createdAt: string;
};

const resolveLogoUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/")) {
        return value;
    }
    return `${API_ORIGIN}${value}`;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

interface StudentPlacementsPageProps {
    searchParams: Promise<{
        placementId?: string | string[];
    }>;
}

export default function StudentPlacementsPage({ searchParams }: StudentPlacementsPageProps) {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const resolvedSearchParams = use(searchParams);
    const [placements, setPlacements] = useState<PlacementRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const highlightedPlacementIdValue = resolvedSearchParams?.placementId;
    const highlightedPlacementId = Array.isArray(highlightedPlacementIdValue)
        ? highlightedPlacementIdValue[0] || ""
        : highlightedPlacementIdValue || "";
    const lastScrolledPlacementId = useRef("");

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/student/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!token) return;

        setLoadingData(true);
        setError("");

        fetch(ENDPOINTS.STUDENT.PLACEMENTS, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json().catch(() => []);
                if (!response.ok) {
                    throw new Error((data as { message?: string } | null)?.message || "Unable to load placements");
                }
                setPlacements(Array.isArray(data) ? data : []);
            })
            .catch((fetchError) => {
                setPlacements([]);
                setError(fetchError instanceof Error ? fetchError.message : "Unable to load placements");
            })
            .finally(() => setLoadingData(false));
    }, [token]);

    useEffect(() => {
        if (loadingData || !highlightedPlacementId || placements.length === 0) {
            return;
        }

        if (lastScrolledPlacementId.current === highlightedPlacementId) {
            return;
        }

        const element = document.querySelector(`[data-placement-id="${highlightedPlacementId}"]`);
        if (element instanceof HTMLElement) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            lastScrolledPlacementId.current = highlightedPlacementId;
        }
    }, [highlightedPlacementId, loadingData, placements]);

    const featuredPlacement = useMemo(
        () => placements.find((placement) => placement.id === highlightedPlacementId) || null,
        [highlightedPlacementId, placements],
    );

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Placements">
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Placements</div>
                        <div className={styles.bannerSub}>Browse current job opportunities .</div>
                    </div>
                    <Trophy size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{loadingData ? "-" : placements.length}</span>
                        <span className={styles.summaryLabel}>Open Opportunities</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{featuredPlacement ? featuredPlacement.companyName : "All"}</span>
                        <span className={styles.summaryLabel}>{featuredPlacement ? "Highlighted Company" : "Current View"}</span>
                    </div>
                </div>

                {error ? (
                    <div className={styles.errorBanner}>{error}</div>
                ) : null}

                {featuredPlacement ? (
                    <div className={styles.highlightNote}>
                        Viewing the placement shared in your notification: <strong>{featuredPlacement.companyName}</strong>
                    </div>
                ) : null}

                {loadingData ? (
                    <div className={styles.tableCard}>
                        <div className={styles.tableLoading}>Loading placements...</div>
                    </div>
                ) : placements.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Tray size={52} color="#cbd5e1" weight="duotone" />
                        <h3>No placements available right now.</h3>
                        <p>Check back later for new placement opportunities from the admin team.</p>
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Role</th>
                                        <th>Salary</th>
                                        <th>Passout Year</th>
                                        <th>Description</th>
                                        <th>Posted</th>
                                        <th>Apply</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {placements.map((placement) => {
                                        const logoUrl = resolveLogoUrl(placement.companyLogo);
                                        const isHighlighted = placement.id === highlightedPlacementId;

                                        return (
                                            <tr
                                                key={placement.id}
                                                data-placement-id={placement.id}
                                                className={isHighlighted ? styles.rowHighlighted : ""}
                                            >
                                                <td>
                                                    <div className={styles.companyBlock}>
                                                        {logoUrl ? (
                                                            <img src={logoUrl} alt={placement.companyName} className={styles.companyLogo} />
                                                        ) : (
                                                            <div className={styles.companyFallback}>
                                                                {placement.companyName.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className={styles.companyName}>{placement.companyName}</div>
                                                            
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tablePrimary}>
                                                        <Briefcase size={16} />
                                                        <span>{placement.designation}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tablePrimary}>
                                                    
                                                        <span>{placement.salaryRange}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.dateBadge}>
                                                        
                                                        {placement.passoutYears}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.tableDescription}>{placement.jobDescription}</div>
                                                </td>
                                                <td>
                                                    <span className={styles.dateBadge}>{formatDate(placement.createdAt)}</span>
                                                </td>
                                                <td className={styles.actionCell}>
                                                    <a
                                                        href={placement.applyLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={styles.applyBtn}
                                                    >
                                                        Apply
                                                        <ArrowSquareOut size={16} weight="bold" />
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </LMSShell>
    );
}
