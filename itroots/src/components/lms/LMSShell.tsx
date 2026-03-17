"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLMSAuth } from "@/app/lms/auth-context";
import { ENDPOINTS } from "@/config/api";
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
    SignOut,
    User,
    CaretDown,
    List,
    Chalkboard,
    Trophy,
    Bell,
    Scroll,
    VideoCamera,
} from "@phosphor-icons/react";

const ICON_MAP: Record<string, React.ElementType> = {
    "Dashboard": SquaresFour,
    "Course Overview": Chalkboard,
    "Analytics & Reporting": ChartBar,
    "Students Overview": ChartBar,
    "Students Test": Exam,
    "Tests": Exam,
    "Event Calendar": CalendarDots,
    "Grades": Trophy,
    "Students Engagement": ChartBar,
    "Assignments": PencilSimpleLine,
    "Notifications": Bell,
    "Send Notifications": Bell,
    "My Courses": GraduationCap,
    "Online Test": Exam,
    "Attendance": CalendarDots,
    "Live Class": CalendarDots,
    "Live Classes": CalendarDots,
    "Resources": BookOpen,
    "Study Material": BookOpen,
    "Study Materials": BookOpen,
    "Video Lectures": VideoCamera,
    "Performance": ChartBar,
    "Profile Settings": Gear,
    "Admin Dashboard": SquaresFour,
    "Placements": Trophy,
    "Manage Students": UsersThree,
    "Manage Faculty": Chalkboard,
    "Batch Management": CalendarDots,
    "Course Management": BookOpen,
    "Settings": Gear,
    "Certificates": Scroll,
};

const ICON_COLOR_MAP: Record<string, string> = {
    "Dashboard": "#f59e0b",
    "Course Overview": "#0ea5e9",
    "Analytics & Reporting": "#ef4444",
    "Students Overview": "#ef4444",
    "Students Test": "#f97316",
    "Tests": "#f97316",
    "Event Calendar": "#14b8a6",
    "Grades": "#f59e0b",
    "Students Engagement": "#ec4899",
    "Assignments": "#f97316",
    "Notifications": "#06b6d4",
    "Send Notifications": "#06b6d4",
    "My Courses": "#3b82f6",
    "Online Test": "#ef4444",
    "Attendance": "#14b8a6",
    "Live Class": "#14b8a6",
    "Live Classes": "#14b8a6",
    "Resources": "#6366f1",
    "Study Material": "#6366f1",
    "Study Materials": "#6366f1",
    "Video Lectures": "#8b5cf6",
    "Performance": "#ec4899",
    "Profile Settings": "#64748b",
    "Admin Dashboard": "#f59e0b",
    "Placements": "#22c55e",
    "Manage Students": "#8b5cf6",
    "Manage Faculty": "#0ea5e9",
    "Batch Management": "#14b8a6",
    "Course Management": "#3b82f6",
    "Settings": "#64748b",
    "Certificates": "#f59e0b",
};

const STUDENT_NAV = [
    {
        section: "",
        items: [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/my-learning", label: "My Courses" },
            // { href: "/assignments", label: "Assignments" },
            { href: "/attendance", label: "Attendance" },
            { href: "/calendar", label: "Live Classes" },
            { href: "/resources", label: "Study Material" },
            { href: "/tests", label: "Online Test" },
            { href: "/placements", label: "Placements" },
            { href: "/announcements", label: "Notifications" },
            { href: "/certificates", label: " My Certificates" },
            { href: "/settings", label: "Profile Settings" },
        ],
    },
];

const Faculty_NAV = [
    {
        section: "",
        items: [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/content?type=VIDEO", label: "Video Lectures" },
            { href: "/content?type=RESOURCE", label: "Study Material" },
            // { href: "/assignments", label: "Assignments" },
            { href: "/tests", label: "Tests" },
            { href: "/attendance", label: "Attendance" },
            { href: "/calendar", label: "Live Classes" },
            { href: "/analytics", label: "Students Overview" },
            { href: "/announcements", label: "Send Notifications" },
            { href: "/settings", label: "Profile Settings" },
        ],
    },
];

const ADMIN_NAV = [
    {
        section: "",
        items: [
            { href: "/dashboard", label: "Admin Dashboard" },
            { href: "/courses", label: "Course Management" },
            { href: "/batches", label: "Batch Management" },
            { href: "/teachers", label: "Manage Faculty" },
            { href: "/students", label: "Manage Students" },
            { href: "/placements", label: "Placements" },
            { href: "/notifications", label: "Notifications" },
            { href: "/certificates", label: "Certificates" },
            { href: "/settings", label: "Settings" },
        ],
    },
];
export default function LMSShell({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
    const { user, logout, isLoading } = useLMSAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [currentSearch, setCurrentSearch] = useState("");
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentSearch(window.location.search);
        }
    }, [pathname]);

    if (isLoading) return null;

    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isAdminDomain = hostname.startsWith("admin");
    const isSubdomain = hostname.toLowerCase().startsWith("admin") || hostname.toLowerCase().startsWith("student") || hostname.toLowerCase().startsWith("faculty");
    const isAdminSidebar = isAdminDomain && user?.role === "SUPER_ADMIN";

    const navGroups =
        isAdminDomain && user?.role === "SUPER_ADMIN"
            ? ADMIN_NAV
            : user?.role?.toUpperCase() === "FACULTY" ? Faculty_NAV
                : user?.role === "CMS_MANAGER"
                    ? []
                    : STUDENT_NAV;

    const handleLogout = () => {
        logout();
        router.push(isSubdomain ? "/login" : "/lms/login");
    };

    const userInitials = user?.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
        : "S";

    const profileImageUrl = user?.profileImage
        ? (user.profileImage.startsWith("http://") || user.profileImage.startsWith("https://")
            ? user.profileImage
            : `${new URL(ENDPOINTS.AUTH.ME).origin}${user.profileImage}`)
        : "";

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

        if (pathname.toLowerCase().startsWith("/lms/teacher/")) {
            return pathname.replace(/\/lms\/teacher/i, "") || "/";
        }

        if (pathname.toLowerCase() === "/lms/teacher") {
            return "/dashboard";
        }

        return pathname;
    })();

    const isNavItemActive = (href: string) => {
        const [itemPath, queryString] = href.split("?");
        const currentSearchParams = new URLSearchParams(currentSearch);
        const pathMatches =
            normalizedPathname === itemPath
            || normalizedPathname.startsWith(`${itemPath}/`);

        if (!pathMatches) {
            return false;
        }

        if (!queryString) {
            return true;
        }

        const expectedQuery = new URLSearchParams(queryString);
        return Array.from(expectedQuery.entries()).every(([key, value]) => currentSearchParams.get(key) === value);
    };

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

                <nav className={`${styles.sidebarNav} ${isAdminSidebar ? styles.adminSidebarNav : ""}`} aria-label="LMS">
                    {navGroups.map((group) => (
                        <div key={group.section || "default"}>
                            {group.section && <div className={styles.navSectionLabel}>{group.section}</div>}
                            {group.items.map((item) => {
                                const isActive = isNavItemActive(item.href);
                                const IconComponent = ICON_MAP[item.label] || SquaresFour;
                                const iconColor = isActive ? "#ffffff" : (ICON_COLOR_MAP[item.label] || "#0881ec");
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span className={styles.navIcon} style={{ color: iconColor }}>
                                            <IconComponent size={20} weight={isActive ? "fill" : "duotone"} />
                                        </span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarVersion}>LMS V.1</div>
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
                                type="button"
                                className={styles.profileTrigger}
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                aria-expanded={profileDropdownOpen}
                                aria-haspopup="true"
                            >
                                <div className={styles.userAvatar}>{profileImageUrl ? <img src={profileImageUrl} alt={user?.name || "User"} className={styles.avatarImage} /> : userInitials}</div>
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
                                        <div className={styles.dropdownAvatar}>{profileImageUrl ? <img src={profileImageUrl} alt={user?.name || "User"} className={styles.dropdownAvatarImage} /> : userInitials}</div>
                                        <div>
                                            <div className={styles.dropdownName}>{user?.role?.toUpperCase() === "FACULTY" ? "Faculty" : user?.role === "SUPER_ADMIN" ? "Admin" : "Student"}</div>
                                            <div className={styles.dropdownEmail}>{user?.email}</div>
                                        </div>
                                    </div>

                                    <div className={styles.dropdownDivider} />

                                    <Link
                                        href={user?.role === "SUPER_ADMIN" ? "/dashboard" : "/settings"}
                                        className={styles.dropdownItem}
                                        onClick={() => setProfileDropdownOpen(false)}
                                    >
                                        <User size={18} weight="regular" />
                                        My Profile
                                    </Link>

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
