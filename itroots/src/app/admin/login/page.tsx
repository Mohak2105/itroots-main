"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import {
    Fingerprint,
    Eye,
    EyeSlash,
    Warning,
    CircleNotch,
    Envelope,
    Lock,
} from "@phosphor-icons/react";
import styles from "./admin-login.module.css";

export default function AdminLoginPage() {
    const router = useRouter();
    const { login, logout } = useLMSAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await login(email.trim(), password);

        if (result.success) {
            const userRole = result.user?.role;

            if (userRole === "SUPER_ADMIN" || userRole === "CMS_MANAGER") {
                router.push("/dashboard");
            } else {
                logout();
                setError("Access Denied: Only admins and CMS managers can access this panel.");
                setIsLoading(false);
            }
        } else {
            setError(result.message);
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.bgBlob1}></div>
            <div className={styles.bgBlob2}></div>
            <div className={styles.bgGrid}></div>

            <div className={styles.glassCard}>
                <div className={styles.logoContainer}>
                    <div className={styles.iconWrapper}>
                        <Fingerprint size={42} weight="duotone" />
                    </div>
                </div>

                <h1 className={styles.title}>Admin Control</h1>
                <p className={styles.subtitle}>Authorized personnel access only</p>

                {error && (
                    <div className={styles.errorBox}>
                        <Warning size={20} weight="fill" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Administrator Email</label>
                        <div className={styles.inputWrapper}>
                            <Envelope size={20} className={styles.inputIcon} />
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="admin@itroots.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Security Key / Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={20} className={styles.inputIcon} />
                            <input
                                type={showPass ? "text" : "password"}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.togglePass}
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>



                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.submitBtn}
                    >
                        {isLoading ? (
                            <><CircleNotch size={22} className={styles.spin} /> Authenticating...</>
                        ) : (
                            "Execute Access"
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}
