"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ChartBar } from "@phosphor-icons/react";
import styles from "./engagement.module.css";

export default function FacultyEngagementPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    return (
        <LMSShell pageTitle="Students Engagement">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Students Engagement</div>
                        <div className={styles.bannerSub}>Analyze how students are interacting with your course materials and videos.</div>
                    </div>
                    <ChartBar size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>
            </div>
        </LMSShell>
    );
}

