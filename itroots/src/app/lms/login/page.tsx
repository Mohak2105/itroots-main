"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    GraduationCap,
    PlayCircle,
    ClipboardText,
    ChartBar,
    Calendar,
    Megaphone,
    Eye,
    EyeSlash,
    Envelope,
    Lock,
    ArrowRight,
    BookOpen,
    Warning
} from "@phosphor-icons/react";
import { useLMSAuth } from "../auth-context";
import styles from "./login.module.css";

const FEATURES = [
    { icon: PlayCircle, text: "HD Video Lessons", sub: "Learn anytime, anywhere" },
    { icon: ClipboardText, text: "Tests & Assignments", sub: "Auto-graded assessments" },
    { icon: ChartBar, text: "Progress Tracking", sub: "Real-time analytics" },
    { icon: Calendar, text: "Class Schedule", sub: "Batch timetable" },
    { icon: Megaphone, text: "Announcements", sub: "Stay updated daily" },
    { icon: BookOpen, text: "Study Resources", sub: "PDFs, PPTs & notes" },
];

export default function LMSLoginPage() {
    const router = useRouter();
    const { login, logout } = useLMSAuth();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await login(identifier.trim(), password);

        if (result.success) {
            const userRole = result.user?.role;

            if (userRole === "SUPER_ADMIN" || userRole === "CMS_MANAGER") {
                logout();
                setError("Access Denied: Please use the Admin Portal at /admin/login.");
                setIsLoading(false);
            } else if (userRole === "STUDENT") {
                router.push("/student/dashboard");
            } else {
                logout();
                setError("This portal is for students. Please use the Instructor Portal.");
                setIsLoading(false);
            }
        } else {
            setError(result.message);
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.loginPage}>
            <section className={styles.brandPanel}>
                <div className={styles.brandGrid} />
                <div className={styles.brandOrbPrimary} />
                <div className={styles.brandOrbSecondary} />
                <div className={styles.brandContent}>
                    <div className={styles.brandTopBar}>
                        <Link href="/" className={styles.brandLogo}>
                            <Image
                                src="/images/logo.png"
                                alt="ITROOTS"
                                width={200}
                                height={65}
                                priority
                            />
                        </Link>
                        
                    </div>

                    <div className={styles.heroBlock}>
                       
                        <h1 className={styles.brandHeading}>
                            Learn live. Practice daily. <span>Grow with confidence.</span>
                        </h1>
                        <p className={styles.brandDescription}>
                            Your classes, assignments, study material, attendance, and progress reports stay together in one focused workspace.
                        </p>
                    </div>

                    <div className={styles.featureGrid}>
                        {FEATURES.map((feature) => (
                            <div key={feature.text} className={styles.featureCard}>
                                <div className={styles.featureIconWrap}>
                                    <feature.icon size={20} strokeWidth={1.8} />
                                </div>
                                <div>
                                    <div className={styles.featureTitle}>{feature.text}</div>
                                    <div className={styles.featureSub}>{feature.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.formPanel}>
                <div className={styles.formShell}>
                    <div className={styles.formTopBar}>
                        
                        <Link href="/" className={styles.homeLink}>
                            Back to website
                        </Link>
                    </div>

                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <div className={styles.studentBadge}>
                                <GraduationCap size={28} strokeWidth={1.8} />
                            </div>
                            <h2 className={styles.formTitle}>Welcome Back</h2>
                            <p className={styles.formSubtitle}>
                                Sign in to continue your classes, assignments, attendance, and progress tracking.
                            </p>
                        </div>

                        {error && (
                            <div className={styles.errorBox} role="alert">
                                <Warning size={18} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className={styles.fieldGroup}>
                                <div>
                                    <label className={styles.fieldLabel} htmlFor="lms-email">Email or Username</label>
                                    <div className={styles.fieldWrapper}>
                                        <Envelope size={16} className={styles.fieldIconSvg} />
                                        <input
                                            id="lms-email"
                                            type="text"
                                            className={styles.fieldInput}
                                            placeholder="Enter your email or username"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={styles.fieldLabel} htmlFor="lms-password">Password</label>
                                    <div className={styles.fieldWrapper}>
                                        <Lock size={16} className={styles.fieldIconSvg} />
                                        <input
                                            id="lms-password"
                                            type={showPass ? "text" : "password"}
                                            className={styles.fieldInput}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => setShowPass(!showPass)}
                                            aria-label={showPass ? "Hide password" : "Show password"}
                                        >
                                            {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formHint}>
                                Use the email or username shared by your admin.
                            </div>

                            <button
                                id="lms-login-btn"
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isLoading}
                            >
                                {isLoading ? <>Signing In...</> : <>Sign In <ArrowRight size={18} /></>}
                            </button>
                        </form>

                        <div className={styles.adminNote}>
                            Student accounts are created by admin only.
                        </div>
                    </div>

                    
                    
                </div>
            </section>
        </div>
    );
}
