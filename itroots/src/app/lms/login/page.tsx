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
    Users,
    Medal,
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
                setError("Access Denied: Please use admin.itroots.com (or admin.localhost:3000 in dev)");
                setIsLoading(false);
            } else if (userRole === "STUDENT") {
                router.push("/dashboard");
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
            <div className={styles.brandPanel}>
                <div className={styles.wireCircle1} />
                <div className={styles.wireCircle2} />
                <div className={styles.wireLine1} />
                <div className={styles.wireLine2} />

                <div className={styles.brandContent}>
                    <div className={styles.brandLogo}>
                        <Link href="/">
                            <Image
                                src="/images/logo.png"
                                alt="ITROOTS"
                                width={200}
                                height={65}
                                style={{ height: "65px", width: "auto", cursor: "pointer" }}
                                priority
                            />
                        </Link>
                    </div>

                    <h1 className={styles.brandHeading}>
                        Your Learning<br />
                        Journey <span>Starts Here.</span>
                    </h1>
                    <p className={styles.brandDescription}>
                        Access courses, track progress, and build career-ready skills - all in one portal.
                    </p>

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

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <Users size={18} strokeWidth={1.5} />
                            <span className={styles.statNum}>1000+</span>
                            <span className={styles.statLabel}>Students</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <Medal size={18} />
                            <span className={styles.statNum}>95%</span>
                            <span className={styles.statLabel}>Placement</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <BookOpen size={18} strokeWidth={1.5} />
                            <span className={styles.statNum}>15+</span>
                            <span className={styles.statLabel}>Courses</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.formPanel}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <div className={styles.studentBadge}>
                            <GraduationCap size={28} strokeWidth={1.8} />
                        </div>
                        <h2 className={styles.formTitle}>Welcome Back</h2>
                        <p className={styles.formSubtitle}>Sign in to your learning portal</p>
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
                                        placeholder="Email or Username"
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
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPass(!showPass)}
                                    >
                                        {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
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

                    <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
                        Student accounts are created by admin only.
                    </div>
                </div>

                <div className={styles.studentIllustration}>
                    <Image
                        src="/images/student-login-art.png.png"
                        alt="Students Illustration"
                        width={350}
                        height={250}
                        style={{ width: "100%", height: "auto", objectFit: "contain" }}
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
