"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLMSAuth } from "../../auth-context";

import {
    ChalkboardTeacher,
    Eye,
    EyeSlash,
    Warning,
    CircleNotch,
    Envelope,
    Lock,
} from "@phosphor-icons/react";
import Link from "next/link";
import styles from "./teacher-login.module.css";

export default function TeacherLoginPage() {
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
            if (userRole === "TEACHER") {
                router.push("/dashboard");
            } else if (userRole === "SUPER_ADMIN" || userRole === "CMS_MANAGER") {
                logout();
                setError("Access Denied: Please use admin.itroots.com (or admin.localhost:3000 in dev)");
                setIsLoading(false);
            } else {
                // Must be a student
                logout();
                setError("This portal is for instructors. Please use the Student Portal.");
                setIsLoading(false);
            }
        } else {
            setError(result.message || "Invalid email or password.");
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
                        <ChalkboardTeacher size={42} weight="duotone" />
                    </div>
                </div>

                <h1 className={styles.title}>Teacher Portal</h1>
                <p className={styles.subtitle}>Sign in to manage your digital classroom</p>

                {error && (
                    <div className={styles.errorBox}>
                        <Warning size={20} weight="fill" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <div className={styles.inputWrapper}>
                            <Envelope size={20} className={styles.inputIcon} />
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="teacher@itroots.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
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
                            <><CircleNotch size={22} className={styles.spin} /> Signing In...</>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}
