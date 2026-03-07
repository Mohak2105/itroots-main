"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    getCoursesForTeacher,
    getAssignmentsForCourse,
    SUBMISSIONS,
    USERS,
} from "@/data/lms-data";
import { ClipboardText } from "@phosphor-icons/react";

export default function TeacherAssignmentsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "TEACHER")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const myCourses = getCoursesForTeacher(user.id);

    return (
        <LMSShell pageTitle="Assignments">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #0c2d4c 0%, #0881ec 100%)',
                    borderRadius: '16px',
                    padding: '1.75rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff',
                    overflow: 'hidden',
                }}>
                    <div>
                        <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>Assignments</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', maxWidth: '500px' }}>Create, manage, and grade assignments for your courses.</div>
                    </div>
                    <ClipboardText size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{ padding: '0.6rem 1.25rem', background: '#0881ec', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                        + New Assignment
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {myCourses.map((course) => {
                        const assignments = getAssignmentsForCourse(course.id);
                        return (
                            <div key={course.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{course.title}</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0881ec', background: 'rgba(8, 129, 236, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                                        {assignments.length} Assignments
                                    </span>
                                </div>

                                <div style={{ padding: '1rem' }}>
                                    {assignments.length === 0 ? (
                                        <p style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No assignments created for this course.</p>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                                                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ASSIGNMENT TITLE</th>
                                                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>DUE DATE</th>
                                                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>SUBMISSIONS</th>
                                                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignments.map((ass) => {
                                                    const subCount = SUBMISSIONS.filter(s => s.assignmentId === ass.id).length;
                                                    const gradedCount = SUBMISSIONS.filter(s => s.assignmentId === ass.id && s.grade !== undefined).length;
                                                    return (
                                                        <tr key={ass.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '1rem' }}>
                                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0a0f1e' }}>{ass.title}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ass.description.substring(0, 50)}...</div>
                                                            </td>
                                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#1e293b' }}>
                                                                {new Date(ass.dueDate).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0a0f1e' }}>{subCount} Submitted</div>
                                                                <div style={{ fontSize: '0.72rem', color: subCount === gradedCount ? '#10b981' : '#ee9602' }}>
                                                                    {gradedCount}/{subCount} Graded
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
                                                                <button style={{ padding: '6px 12px', background: '#0881ec', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>View Submissions</button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </LMSShell>
    );
}
