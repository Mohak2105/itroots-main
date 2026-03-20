export type PortalType = "admin" | "student" | "faculty";

const PORTAL_BASES: Record<PortalType, string> = {
    admin: "/admin",
    student: "/student",
    faculty: "/faculty",
};

export const ADMIN_LOGIN_PATH = "/admin/login";
export const STUDENT_LOGIN_PATH = "/student/login";
export const FACULTY_LOGIN_PATH = "/faculty/login";

type PathParts = {
    pathname: string;
    search: string;
    hash: string;
};

function splitPathParts(path: string): PathParts {
    const match = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);

    return {
        pathname: match?.[1] || "/",
        search: match?.[2] || "",
        hash: match?.[3] || "",
    };
}

function normalizePathname(pathname: string) {
    if (!pathname) {
        return "/";
    }

    const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");

    return normalized || "/";
}

export function detectPortalFromPathname(pathname?: string | null): PortalType | null {
    const normalizedPath = normalizePathname((pathname || "").toLowerCase());

    if (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) {
        return "admin";
    }

    if (
        normalizedPath === "/student"
        || normalizedPath.startsWith("/student/")
        || normalizedPath === "/lms/login"
        || normalizedPath === "/lms/student"
        || normalizedPath.startsWith("/lms/student/")
    ) {
        return "student";
    }

    if (
        normalizedPath === "/faculty"
        || normalizedPath.startsWith("/faculty/")
        || normalizedPath === "/lms/teacher"
        || normalizedPath.startsWith("/lms/teacher/")
    ) {
        return "faculty";
    }

    return null;
}

export function detectPortalFromUserRole(role?: string | null): PortalType {
    const normalizedRole = String(role || "").toUpperCase();

    if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "CMS_MANAGER") {
        return "admin";
    }

    if (normalizedRole === "FACULTY") {
        return "faculty";
    }

    return "student";
}

export function stripPortalPathPrefix(pathname?: string | null) {
    const normalizedPath = normalizePathname(pathname || "/");

    if (normalizedPath === "/lms/login") {
        return "/login";
    }

    const prefixes = [
        "/admin",
        "/student",
        "/faculty",
        "/lms/student",
        "/lms/teacher",
    ];

    for (const prefix of prefixes) {
        if (normalizedPath === prefix) {
            return "/dashboard";
        }

        if (normalizedPath.startsWith(`${prefix}/`)) {
            return normalizedPath.slice(prefix.length) || "/";
        }
    }

    return normalizedPath;
}

export function buildPortalPath(portal: PortalType, path = "/dashboard") {
    const { pathname, search, hash } = splitPathParts(path);
    const base = PORTAL_BASES[portal];
    const strippedPath = stripPortalPathPrefix(pathname);
    const normalizedPath = normalizePathname(strippedPath);
    const finalPath = normalizedPath === "/" ? base : `${base}${normalizedPath}`;

    return `${finalPath}${search}${hash}`;
}

export function getPortalLoginPath(portal: PortalType) {
    return buildPortalPath(portal, "/login");
}
