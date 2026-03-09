"use client";

import LMSShell from "@/components/lms/LMSShell";
import styles from "../dashboard/admin-dashboard.module.css";

export default function AdminSettingsPage() {
    return (
        <LMSShell pageTitle="Portal Settings">
            <div className={styles.pageStack}>
                <div className={styles.welcome}>
                    <div>
                        <h2>System Configuration</h2>
                        <p>Manage global platform parameters, security, and branding.</p>
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>Platform Branding</div>
                        <div style={{ padding: "1.5rem" }}>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.5rem" }}>Institution Name</label>
                                <input type="text" defaultValue="ITROOTS Academy" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.5rem" }}>Support Email</label>
                                <input type="text" defaultValue="support@itroots.com" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                            </div>
                            <button style={{ background: "#0881ec", color: "#fff", border: "none", padding: "0.8rem 1.5rem", borderRadius: "10px", fontWeight: 700 }}>Save Changes</button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>Security & Access</div>
                        <div style={{ padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Enable Two-Factor</div>
                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Require 2FA for all admin accounts.</div>
                                </div>
                                <div style={{ width: "40px", height: "20px", background: "#e5e7eb", borderRadius: "100px" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Public Registration</div>
                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Allow new students to sign up manually.</div>
                                </div>
                                <div style={{ width: "40px", height: "20px", background: "#10b981", borderRadius: "100px", position: "relative" }}>
                                    <div style={{ position: "absolute", right: "2px", top: "2px", width: "16px", height: "16px", background: "#fff", borderRadius: "50%" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
