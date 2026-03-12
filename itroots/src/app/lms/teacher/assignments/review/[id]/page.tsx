"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    SUBMISSIONS,
    ASSIGNMENTS,
    USERS,
} from "@/data/lms-data";
import { FilePdf, CheckCircle } from "@phosphor-icons/react";

export default function GradeSubmissionPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const params = useParams();
    const submissionId = params?.id as string;

    const [grade, setGrade] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user?.role?.toUpperCase() !== "FACULTY")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const submission = SUBMISSIONS.find(s => s.id === submissionId);
    if (!submission) return <LMSShell pageTitle="Error">Submission not found.</LMSShell>;

    const student = USERS.find(u => u.id === submission.studentId);
    const assignment = ASSIGNMENTS.find(a => a.id === submission.assignmentId);

    async function handleGrade(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1000));
        alert(`Graded ${student?.name} successfully! (Mock)`);
        router.push("/lms/Faculty/dashboard");
    }

    return (
        <LMSShell pageTitle="Review Submission">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#0881ec', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}>â† Back to Dashboard</button>

                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{assignment?.title}</h2>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b' }}>Student: <strong style={{ color: '#0a0f1e' }}>{student?.name}</strong></span>
                            <span style={{ color: '#64748b' }}>Submitted: <strong style={{ color: '#0a0f1e' }}>{new Date(submission.submittedAt).toLocaleDateString()}</strong></span>
                            <span style={{ color: '#64748b' }}>Max Marks: <strong style={{ color: '#0a0f1e' }}>{assignment?.maxMarks}</strong></span>
                        </div>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Submitted Work</h3>
                            <div style={{ padding: '1.5rem', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ef4444' }}>
                                        <FilePdf size={48} />
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>submission_v1.pdf</div>
                                    <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Download File</button>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleGrade}>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Award Grade</label>
                                    <input
                                        type="number"
                                        max={assignment?.maxMarks}
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder={`Max ${assignment?.maxMarks}`}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Feedback (Optional)</label>
                                    <input
                                        type="text"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Good work, but try to improve..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #0c2d4c 0%, #0881ec 100%)', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                            >
                                {isSubmitting ? "Submitting Grade..." : <><CheckCircle size={20} /> Finish Grading</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}

