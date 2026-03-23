"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, Gear, LockKey, ShieldCheck, User as UserIcon, WarningCircle, X } from "@phosphor-icons/react";
import { useLMSAuth } from "@/app/lms/auth-context";
import LMSShell from "@/components/lms/LMSShell";
import { API_ORIGIN, ENDPOINTS } from "@/config/api";
import { ADMIN_LOGIN_PATH, FACULTY_LOGIN_PATH, STUDENT_LOGIN_PATH } from "@/utils/portalRoutes";
import styles from "./profile-settings.module.css";

type SupportedRole = "STUDENT" | "FACULTY" | "ADMIN";

type Props = {
    requiredRole: SupportedRole;
    roleLabel: string;
    pageTitle: string;
};

type MessageState = {
    type: "success" | "error";
    text: string;
} | null;

function resolveAssetUrl(filePath?: string) {
    if (!filePath) {
        return "";
    }

    if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("data:")) {
        return filePath;
    }

    return `${API_ORIGIN}${filePath}`;
}

export default function ProfileSettingsPanel({ requiredRole, roleLabel, pageTitle }: Props) {
    const { user, token, isLoading, refreshUser } = useLMSAuth();
    const router = useRouter();
    const [profileMessage, setProfileMessage] = useState<MessageState>(null);
    const [passwordMessage, setPasswordMessage] = useState<MessageState>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [profileImagePayload, setProfileImagePayload] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const loginPath = requiredRole === "ADMIN"
            ? ADMIN_LOGIN_PATH
            : requiredRole === "FACULTY"
                ? FACULTY_LOGIN_PATH
                : STUDENT_LOGIN_PATH;

        if (!isLoading) {
            const normalizedRole = user?.role?.toUpperCase();
            const hasRole = requiredRole === "ADMIN"
                ? normalizedRole === "SUPER_ADMIN" || normalizedRole === "CMS_MANAGER"
                : requiredRole === "FACULTY"
                    ? normalizedRole === "FACULTY"
                    : user?.role === requiredRole;

            if (!user || !hasRole) {
                router.push(loginPath);
            }
        }
    }, [isLoading, requiredRole, router, user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
        }));
        setImagePreview(resolveAssetUrl(user.profileImage));
    }, [user]);

    const userInitials = useMemo(() => {
        if (!user?.name) {
            if (requiredRole === "ADMIN") {
                return "AD";
            }

            return requiredRole === "FACULTY" ? "TR" : "ST";
        }

        return user.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [requiredRole, user?.name]);

    const usePasswordModal = requiredRole === "STUDENT" || requiredRole === "FACULTY";

    if (isLoading || !user) {
        return null;
    }

    const openPasswordModal = () => {
        setPasswordMessage(null);
        setShowPasswordModal(true);
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordMessage(null);
        setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }));
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setSelectedFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            setProfileImagePayload(result);
            setImagePreview(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!token) {
            setProfileMessage({ type: "error", text: "Session expired. Please sign in again." });
            return;
        }

        setIsSavingProfile(true);
        setProfileMessage(null);

        try {
            const response = await fetch(ENDPOINTS.AUTH.UPDATE_PROFILE, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    fileData: profileImagePayload || undefined,
                    fileName: selectedFileName || undefined,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile");
            }

            await refreshUser();
            setProfileImagePayload("");
            setSelectedFileName("");
            setProfileMessage({ type: "success", text: "Profile updated successfully." });
        } catch (error) {
            setProfileMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Unable to update profile",
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!token) {
            setPasswordMessage({ type: "error", text: "Session expired. Please sign in again." });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setPasswordMessage({ type: "error", text: "New password and confirm password do not match." });
            return;
        }

        setIsSavingPassword(true);
        setPasswordMessage(null);

        try {
            const response = await fetch(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to update password");
            }

            setFormData((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }));
            setPasswordMessage({ type: "success", text: "Password updated successfully." });
        } catch (error) {
            setPasswordMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Unable to update password",
            });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <LMSShell pageTitle={pageTitle}>
            <div className={styles.page}>
                <div className={styles.banner}>
                    <div>
                        <div className={styles.bannerTitle}>Account Settings</div>
                        <div className={styles.bannerSub}>Update your profile photo, contact details, and password.</div>
                    </div>
                    <Gear size={56} color="rgba(255,255,255,0.22)" weight="duotone" />
                </div>

                <div className={styles.layout}>
                    <div className={styles.profileCard}>
                        <div className={styles.avatarWrap}>
                            {imagePreview ? (
                                <img src={imagePreview} alt={`${user.name} profile`} className={styles.avatarImage} />
                            ) : (
                                <div className={styles.avatarCircle}>{userInitials}</div>
                            )}
                        </div>
                        <label className={styles.uploadButton}>
                            <Camera size={16} weight="bold" />
                            Upload Photo
                            <input type="file" accept="image/*" className={styles.hiddenInput} onChange={handleImageChange} />
                        </label>
                        {selectedFileName && <div className={styles.fileHint}>{selectedFileName}</div>}
                        <div className={styles.profileName}>{user.name}</div>
                        <div className={styles.profileEmail}>{user.email}</div>
                        <div className={styles.roleBadge}>
                            <ShieldCheck size={14} weight="fill" /> {roleLabel}
                        </div>
                    </div>

                    <div className={styles.forms}>
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <UserIcon size={20} weight="duotone" color="#0881ec" />
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
                                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email Address <span className={styles.disabledNote}>(cannot be changed)</span></label>
                                        <input type="email" className={styles.input} value={formData.email} disabled />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            className={styles.input}
                                            value={formData.phone}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                                            placeholder="+91 9000000000"
                                        />
                                    </div>
                                </div>

                                {profileMessage && (
                                    <div className={`${styles.message} ${profileMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}>
                                        {profileMessage.type === "success" ? <CheckCircle size={18} weight="fill" /> : <WarningCircle size={18} weight="fill" />}
                                        {profileMessage.text}
                                    </div>
                                )}

                                <div className={styles.formFooter}>
                                    <button type="submit" className={styles.saveBtn} disabled={isSavingProfile}>
                                        {isSavingProfile ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <LockKey size={20} weight="duotone" color="#8b5cf6" />
                                Change Password
                            </div>
                            {usePasswordModal ? (
                                <div className={styles.passwordActionWrap}>
                                    <p className={styles.passwordActionText}>
                                        Open the password popup to update your current password securely.
                                    </p>
                                    <button type="button" className={styles.saveBtnSecondary} onClick={openPasswordModal}>
                                        Change Password
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword}>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label>Current Password</label>
                                            <input
                                                type="password"
                                                className={styles.input}
                                                value={formData.currentPassword}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, currentPassword: event.target.value }))}
                                                placeholder="Enter current password"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                className={styles.input}
                                                value={formData.newPassword}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))}
                                                placeholder="Enter new password"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Confirm Password</label>
                                            <input
                                                type="password"
                                                className={styles.input}
                                                value={formData.confirmPassword}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                                                placeholder="Repeat new password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {passwordMessage && (
                                        <div className={`${styles.message} ${passwordMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}>
                                            {passwordMessage.type === "success" ? <CheckCircle size={18} weight="fill" /> : <WarningCircle size={18} weight="fill" />}
                                            {passwordMessage.text}
                                        </div>
                                    )}

                                    <div className={styles.formFooter}>
                                        <button type="submit" className={styles.saveBtnSecondary} disabled={isSavingPassword}>
                                            {isSavingPassword ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {usePasswordModal && showPasswordModal ? (
                <div className={styles.modalOverlay} onClick={closePasswordModal}>
                    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <div className={styles.modalTitle}>Change Password</div>
                                <div className={styles.modalSubtext}>Enter your current password and choose a new one.</div>
                            </div>
                            <button type="button" className={styles.modalCloseButton} onClick={closePasswordModal} aria-label="Close password popup">
                                <X size={18} weight="bold" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={formData.currentPassword}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, currentPassword: event.target.value }))}
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={formData.newPassword}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))}
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={formData.confirmPassword}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                                        placeholder="Repeat new password"
                                        required
                                    />
                                </div>
                            </div>

                            {passwordMessage && (
                                <div className={`${styles.message} ${passwordMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}>
                                    {passwordMessage.type === "success" ? <CheckCircle size={18} weight="fill" /> : <WarningCircle size={18} weight="fill" />}
                                    {passwordMessage.text}
                                </div>
                            )}

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.modalSecondaryButton} onClick={closePasswordModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveBtnSecondary} disabled={isSavingPassword}>
                                    {isSavingPassword ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </LMSShell>
    );
}
