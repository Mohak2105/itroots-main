"use client";

import type { CSSProperties } from "react";
import LMSShell from "@/components/lms/LMSShell";
import styles from "../dashboard/admin-dashboard.module.css";

export default function AdminSettingsPage() {
    const sidebarActiveButtonStyle: CSSProperties = {
        background: "linear-gradient(90deg, #0c4a7f 0%, #1d8ef0 100%)",
        color: "#fff",
        border: "none",
        padding: "0.8rem 1.5rem",
        borderRadius: "10px",
        fontWeight: 700,
        boxShadow: "0 10px 20px rgba(12, 74, 127, 0.18)",
    };

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
                        <div className={styles.sectionHeader}>Admin Settings</div>
                        <div style={{ padding: "1.5rem" }}>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.5rem" }}>Admin Email</label>
                                <input type="text" defaultValue="admin@itroots.com" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                            </div>
                            <button style={sidebarActiveButtonStyle}>Save Changes</button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>Security</div>
                        <div style={{ padding: "1.5rem" }}>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.5rem" }}>Admin Password</label>
                                <input type="password" placeholder="Enter new password" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "0.5rem" }} />
                                <input type="password" placeholder="Confirm new password" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", marginBottom: "0.5rem" }}>Admin Session Timeout (Minutes)</label>
                                <input type="number" defaultValue="30" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                            </div>
                            <button style={sidebarActiveButtonStyle}>Update Security Settings</button>
                        </div>
                    </div>


                </div>
            </div>
        </LMSShell>
    );
}
