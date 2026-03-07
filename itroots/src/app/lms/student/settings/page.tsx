"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { User, LockKey, ShieldCheck, Gear } from "@phosphor-icons/react";
import styles from "./settings.module.css";

export default function StudentSettingsPage() {
    const { user, isLoading } = useLMSAuth();
    const router = useRouter();
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "STUDENT")) {
            router.push("/lms/login");
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
            }));
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const userInitials = user.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
        : "ST";

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Password update functionality will be integrated soon.");
    };

    return (
        <LMSShell pageTitle="Profile Settings">
            <div className={styles.page}>
                {/* Banner */}
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Account Settings</div>
                        <div className={styles.bannerSub}>Manage your personal information and security settings.</div>
                    </div>
                    <Gear size={60} color="rgba(255,255,255,0.2)" weight="duotone" />
                </div>

                <div className={styles.layout}>
                    {/* Profile Card (left) */}
                    <div className={styles.profileCard}>
                        <div className={styles.avatarCircle}>{userInitials}</div>
                        <div className={styles.profileName}>{user.name}</div>
                        <div className={styles.profileEmail}>{user.email}</div>
                        <div className={styles.roleBadge}>
                            <ShieldCheck size={14} weight="fill" /> Student
                        </div>
                    </div>

                    {/* Forms (right) */}
                    <div className={styles.forms}>
                        {/* Personal Info */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <User size={20} weight="duotone" color="#0881ec" />
                                Personal Information
                            </div>
                            <form onSubmit={handleSaveProfile}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email Address <span className={styles.disabledNote}>(cannot be changed)</span></label>
                                        <input
                                            type="email"
                                            className={styles.input}
                                            value={formData.email}
                                            disabled
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            className={styles.input}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 9000000000"
                                        />
                                    </div>
                                </div>
                                <div className={styles.formFooter}>
                                    <button type="submit" className={styles.saveBtn}>
                                        {saved ? "✓ Saved!" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Password */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <LockKey size={20} weight="duotone" color="#8b5cf6" />
                                Change Password
                            </div>
                            <form onSubmit={handleUpdatePassword}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            className={styles.input}
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className={styles.input}
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.formFooter}>
                                    <button type="submit" className={styles.saveBtnSecondary}>
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
