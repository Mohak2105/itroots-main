"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import styles from "./lms-shell.module.css";
import {
    SquaresFour,
    GraduationCap,
    PencilSimpleLine,
    Exam,
    ChartBar,
    BookOpen,
    CalendarDots,
    UsersThree,
    Gear,
    CreditCard,
    SignOut,
    User,
    CaretDown,
    List,
    ChalkboardTeacher,
    Trophy,
    Bell,
    Scroll,
} from "@phosphor-icons/react";

const ICON_MAP: Record<string, React.ElementType> = {
    "Dashboard": SquaresFour,
    "Course Overview": ChalkboardTeacher,
    "Student Management": UsersThree,
    "Analytics & Reporting": ChartBar,
    "Event Calendar": CalendarDots,
    "Grades": Trophy,
    "Students Engagement": ChartBar,
    "Assignments": PencilSimpleLine,
    "Notifications": Bell,
    "My Learning": GraduationCap,
    "Browse Batches": UsersThree,
    "Online Exams": Exam,
    "Attendance": CalendarDots,
    "Resources": BookOpen,
    "Analytics": ChartBar,
    "Performance": ChartBar,
    "Profile Settings": Gear,
    "My Batches": ChalkboardTeacher,
    "Schedule": CalendarDots,
    "Marks Analysis": ChartBar,
    "Admin Analytics": ChartBar,
    "Manage Students": UsersThree,
    "Manage Teachers": ChalkboardTeacher,
    "Batch Schedule": CalendarDots,
    "Course Library": BookOpen,
    "Revenue & Fees": CreditCard,
    "Portal Settings": Gear,
    "Certificates": Scroll,
};

const STUDENT_NAV = [
    {
        section: "",
        items: [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/my-learning", label: "My Learning" },
            { href: "/assignments", label: "Assignments" },
            { href: "/attendance", label: "Attendance" },
            { href: "/calendar", label: "Schedule" },
            { href: "/resources", label: "Resources" },
            { href: "/tests", label: "Online Exams" },
            { href: "/progress", label: "Performance" },
            { href: "/certificates", label: "Certificates" },
        ],
    },
];

const TEACHER_NAV = [
    {
        section: "",
        items: [
            { href: "/dashboard", label: "Course Overview" },
            { href: "/students", label: "Student Management" },
            { href: "/analytics", label: "Analytics & Reporting" },
            { href: "/calendar", label: "Event Calendar" },
            { href: "/grades", label: "Grades" },
            { href: "/engagement", label: "Students Engagement" },
            { href: "/assignments", label: "Assignments" },
            { href: "/announcements", label: "Notifications" },
        ],
    },
];

const ADMIN_NAV = [
    {
        section: "LMS Management",
        items: [
            { href: "/dashboard", label: "Admin Analytics" },
            { href: "/students", label: "Manage Students" },
            { href: "/teachers", label: "Manage Teachers" },
            { href: "/batches", label: "Batch Schedule" },
            { href: "/courses", label: "Course Library" },
            { href: "/payments", label: "Fees Management" },
            { href: "/certificates", label: "Certificates" },
        ],
    },
];

export default function LMSShell({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
    const { user, logout, isLoading } = useLMSAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) return null;

    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isAdminDomain = hostname.startsWith("admin");
    const isSubdomain = hostname.startsWith("admin") || hostname.startsWith("student") || hostname.startsWith("teacher");

    const navGroups =
        isAdminDomain && user?.role === "SUPER_ADMIN"
            ? ADMIN_NAV
            : user?.role === "TEACHER"
                ? TEACHER_NAV
                : user?.role === "CMS_MANAGER"
                    ? []
                    : STUDENT_NAV;

    const handleLogout = () => {
        logout();
        router.push(isSubdomain ? "/login" : "/lms/login");
    };

    const userInitials = user?.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
        : "S";

    const normalizedPathname = (() => {
        if (!pathname) return "/";

        if (pathname.startsWith("/admin/")) {
            return pathname.replace("/admin", "") || "/";
        }

        if (pathname === "/admin") {
            return "/dashboard";
        }

        if (pathname.startsWith("/lms/student/")) {
            return pathname.replace("/lms/student", "") || "/";
        }

        if (pathname === "/lms/student") {
            return "/dashboard";
        }

        if (pathname.startsWith("/lms/teacher/")) {
            return pathname.replace("/lms/teacher", "") || "/";
        }

        if (pathname === "/lms/teacher") {
            return "/dashboard";
        }

        return pathname;
    })();

    return (
        <div className={styles.shell}>
            {sidebarOpen && (
                <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}

            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarLogo}>
                    <Image
                        src="/images/lms_logo.png"
                        alt="ITROOTS"
                        width={400}
                        height={200}
                        style={{ height: "70px", width: "auto" }}
                        priority
                    />
                </div>

                <nav className={styles.sidebarNav} aria-label="LMS">
                    {navGroups.map((group) => (
                        <div key={group.section || "default"}>
                            {group.section && <div className={styles.navSectionLabel}>{group.section}</div>}
                            {group.items.map((item) => {
                                const isActive = normalizedPathname === item.href || normalizedPathname.startsWith(item.href + "/");
                                const IconComponent = ICON_MAP[item.label] || SquaresFour;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span className={styles.navIcon}>
                                            <IconComponent size={20} weight={isActive ? "fill" : "regular"} />
                                        </span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className={styles.main}>
                <header className={styles.topBar}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <button className={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <List size={24} />
                        </button>
                        <h1 className={styles.topBarTitle}>
                            {(user?.role === "SUPER_ADMIN" || user?.role === "CMS_MANAGER")
                                ? "Welcome Admin!"
                                : `Welcome ${user?.name?.split(" ")[0]}!`}
                        </h1>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {user?.role === "STUDENT" && (
                            <Link
                                href="/announcements"
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    border: "1px solid #e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#f8fafc",
                                    color: "#6b7280",
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    transition: "all 0.15s",
                                }}
                                title="Notifications"
                            >
                                <Bell size={18} weight="regular" />
                            </Link>
                        )}
                        <div className={styles.profileDropdownContainer} ref={profileDropdownRef}>
                            <button
                                className={styles.profileTrigger}
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                aria-expanded={profileDropdownOpen}
                                aria-haspopup="true"
                            >
                                <div className={styles.userAvatar}>{userInitials}</div>
                                <CaretDown
                                    size={14}
                                    weight="bold"
                                    className={`${styles.chevron} ${profileDropdownOpen ? styles.chevronUp : ""}`}
                                    color="#6b7280"
                                />
                            </button>

                            {profileDropdownOpen && (
                                <div className={styles.profileDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.dropdownAvatar}>{userInitials}</div>
                                        <div>
                                            <div className={styles.dropdownName}>{user?.role === "TEACHER" ? "Teacher" : user?.role === "SUPER_ADMIN" ? "Admin" : "Student"}</div>
                                            <div className={styles.dropdownEmail}>{user?.email}</div>
                                            <div className={styles.dropdownBadge}>{user?.role}</div>
                                        </div>
                                    </div>

                                    <div className={styles.dropdownDivider} />

                                    <Link
                                        href={user?.role === "TEACHER" ? "/dashboard" : user?.role === "SUPER_ADMIN" ? "/dashboard" : "/settings"}
                                        className={styles.dropdownItem}
                                        onClick={() => setProfileDropdownOpen(false)}
                                    >
                                        <User size={18} weight="regular" />
                                        My Profile
                                    </Link>

                                    {user?.role === "SUPER_ADMIN" && (
                                        <Link href="/settings" className={styles.dropdownItem} onClick={() => setProfileDropdownOpen(false)}>
                                            <Gear size={18} weight="regular" />
                                            Portal Settings
                                        </Link>
                                    )}

                                    <div className={styles.dropdownDivider} />

                                    <button
                                        className={styles.dropdownItemDanger}
                                        onClick={() => {
                                            setProfileDropdownOpen(false);
                                            handleLogout();
                                        }}
                                    >
                                        <SignOut size={18} weight="regular" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className={styles.pageContent}>{children}</main>
            </div>
        </div>
    );
}

