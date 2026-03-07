"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import {
    BATCHES,
    ANNOUNCEMENTS,
    getAnnouncementsForBatch,
} from "@/data/lms-data";
import { Megaphone } from "@phosphor-icons/react";

export default function TeacherAnnouncementsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [message, setMessage] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "TEACHER")) {
            router.push("/lms/login");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const myBatches = BATCHES.filter((b) => b.teacherId === user.id);

    async function handlePost(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedBatchId || !message.trim()) return;

        setIsPosting(true);
        await new Promise(r => setTimeout(r, 800)); // Simulate API call

        // In a real app we'd push to state or refresh
        setMessage("");
        setIsPosting(false);
        alert("Announcement posted successfully! (Mock)");
    }

    return (
        <LMSShell pageTitle="Notifications">
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
                        <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>Notifications</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', maxWidth: '500px' }}>Share updates and important news with your batches.</div>
                    </div>
                    <Megaphone size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    {/* Post Form */}
                    <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Announcement</h3>
                        <form onSubmit={handlePost}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Select Batch</label>
                                <select
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    required
                                >
                                    <option value="">Choose a batch...</option>
                                    {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Announcement Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '120px', fontFamily: 'Inter' }}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isPosting}
                                style={{ width: '100%', padding: '0.875rem', background: '#0881ec', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                {isPosting ? "Posting..." : "Post Announcement →"}
                            </button>
                        </form>
                    </div>

                    {/* Recently Posted */}
                    <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recently Posted</h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {ANNOUNCEMENTS.filter(a => a.teacherId === user.id).slice(0, 5).map(a => {
                                const batch = BATCHES.find(b => b.id === a.batchId);
                                return (
                                    <div key={a.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0881ec', marginBottom: '0.25rem' }}>{batch?.name}</div>
                                        <p style={{ fontSize: '0.82rem', color: '#1e293b', margin: '0 0 0.5rem', lineHeight: 1.5 }}>{a.message.substring(0, 80)}...</p>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
