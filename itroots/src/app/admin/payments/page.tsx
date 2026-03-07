"use client";

import LMSShell from "@/components/lms/LMSShell";
import styles from "../dashboard/admin-dashboard.module.css";

export default function AdminPaymentsPage() {
    return (
        <LMSShell pageTitle="Fees Management">
            <div className={styles.welcome}>
                <h2>Fees Management</h2>
                <p>Track student payments, course revenue, and pending dues.</p>
            </div>

            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Monthly Revenue</span>
                    <span className={styles.statValue} style={{ color: '#10b981' }}>₹0</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Transactions</span>
                    <span className={styles.statValue}>0</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending Dues</span>
                    <span className={styles.statValue} style={{ color: '#ef4444' }}>₹0</span>
                </div>
            </section>

            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '2rem' }}>
                <div style={{ padding: '1.25rem 1.5rem', fontWeight: 800, borderBottom: '1px solid #f3f4f6' }}>Transaction History</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>STUDENT</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>COURSE</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>AMOUNT</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                No transactions found. API connection required.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </LMSShell>
    );
}
