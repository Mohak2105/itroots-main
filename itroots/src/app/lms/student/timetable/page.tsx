"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { getBatchForStudent, getCourseById } from "@/data/lms-data";

export default function TimetablePage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) router.push("/lms/login");
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const batch = getBatchForStudent(user.id);
    const course = batch ? getCourseById(batch.courseId) : null;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const classdays = batch?.schedule?.split("—")[0]?.split(",").map((d) => d.trim()) ?? [];
    const time = batch?.schedule?.split("—")[1]?.trim() ?? "";

    return (
        <LMSShell pageTitle="Timetable">
            <div style={{ marginBottom: "1.75rem" }}>
                <h2 style={{ fontFamily: "Outfit", fontSize: "1.5rem", fontWeight: 800, color: "#0a0f1e", marginBottom: "0.25rem" }}>
                    📅 Weekly Timetable
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
                    {batch ? batch.name : "No batch assigned"}
                </p>
            </div>

            {!batch ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                    No batch schedule found.
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                    {days.map((day) => {
                        const hasClass = classdays.some((d) => day.startsWith(d.substring(0, 3)));
                        return (
                            <div key={day} style={{
                                background: hasClass ? "linear-gradient(135deg, #0c2d4c, #0881ec)" : "#fff",
                                color: hasClass ? "#fff" : "#94a3b8",
                                border: hasClass ? "none" : "1px dashed #e2e8f0",
                                borderRadius: "16px",
                                padding: "1.5rem",
                                textAlign: "center",
                                boxShadow: hasClass ? "0 8px 24px rgba(8,129,236,0.3)" : "none",
                            }}>
                                <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{day}</div>
                                {hasClass ? (
                                    <>
                                        <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "0.4rem" }}>{course?.title}</div>
                                        <div style={{ fontSize: "0.78rem", opacity: 0.7 }}>🕐 {time}</div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: "0.8rem" }}>No Class</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </LMSShell>
    );
}
