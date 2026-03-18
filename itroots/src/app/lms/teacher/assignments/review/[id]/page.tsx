"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { ENDPOINTS } from "@/config/api";

export default function LegacyAssignmentReviewRedirectPage() {
    const { user, isLoading, token } = useLMSAuth();
    const router = useRouter();
    const params = useParams();
    const submissionId = String(params?.id || "");

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/faculty/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const redirectToAssignment = async () => {
            if (!token || !submissionId) return;

            try {
                const response = await fetch(ENDPOINTS.Faculty.ASSIGNMENTS, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json().catch(() => []);
                const assignments = Array.isArray(data) ? data : [];
                const matchedAssignment = assignments.find((assignment: any) =>
                    Array.isArray(assignment.submissions) && assignment.submissions.some((submission: any) => submission.id === submissionId)
                );

                if (matchedAssignment?.id) {
                    router.replace(`/assignments/${matchedAssignment.id}`);
                    return;
                }
            } catch (error) {
                console.error("Unable to redirect legacy assignment review page:", error);
            }

            router.replace("/assignments");
        };

        if (user?.role?.toUpperCase() === "FACULTY") {
            void redirectToAssignment();
        }
    }, [token, submissionId, user, router]);

    if (isLoading || !user) return null;

    return <LMSShell pageTitle="Redirecting">Redirecting to assignment review...</LMSShell>;
}
