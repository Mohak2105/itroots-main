import { NextRequest, NextResponse } from "next/server";

function isStaticPath(pathname: string) {
    return (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    );
}

function cloneWithPathname(request: NextRequest, pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return url;
}

function cloneWithHostAndPathname(request: NextRequest, host: string, pathname: string) {
    const url = request.nextUrl.clone();
    const [hostname, port = ""] = host.split(":");

    url.hostname = hostname;
    url.port = port;
    url.pathname = pathname;

    return url;
}

function getBaseHost(host: string) {
    return host.replace(/^(admin|student|faculty)\./i, "");
}

function mapSubdomainPathToPortal(portal: "admin" | "student" | "faculty", pathname: string) {
    if (portal === "admin") {
        if (pathname === "/" || pathname === "/login" || pathname === "/admin") {
            return "/admin/login";
        }

        return pathname.startsWith("/admin/") ? pathname : `/admin${pathname}`;
    }

    if (portal === "student") {
        if (
            pathname === "/" ||
            pathname === "/login" ||
            pathname === "/student" ||
            pathname === "/lms/login"
        ) {
            return "/student/login";
        }

        if (pathname === "/lms/student") {
            return "/student/dashboard";
        }

        if (pathname.startsWith("/student/")) {
            return pathname;
        }

        if (pathname.startsWith("/lms/student/")) {
            return pathname.replace(/^\/lms\/student/, "/student");
        }

        return `/student${pathname}`;
    }

    if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/faculty" ||
        pathname === "/lms/teacher/login"
    ) {
        return "/faculty/login";
    }

    if (pathname === "/lms/teacher") {
        return "/faculty/dashboard";
    }

    if (pathname.startsWith("/faculty/")) {
        return pathname;
    }

    if (pathname.startsWith("/lms/teacher/")) {
        return pathname.replace(/^\/lms\/teacher/i, "/faculty");
    }

    return `/faculty${pathname}`;
}

export function middleware(request: NextRequest) {
    const hostname = (request.headers.get("host") || "").toLowerCase();
    const { pathname } = request.nextUrl;

    if (isStaticPath(pathname)) {
        return NextResponse.next();
    }

    const isAdminSubdomain =
        hostname.startsWith("admin.") ||
        hostname.startsWith("admin.localhost");
    const isStudentSubdomain =
        hostname.startsWith("student.") ||
        hostname.startsWith("student.localhost");
    const isFacultySubdomain =
        hostname.startsWith("faculty.") ||
        hostname.startsWith("faculty.localhost");

    if (isAdminSubdomain) {
        return NextResponse.redirect(
            cloneWithHostAndPathname(
                request,
                getBaseHost(hostname),
                mapSubdomainPathToPortal("admin", pathname)
            )
        );
    }

    if (isStudentSubdomain) {
        return NextResponse.redirect(
            cloneWithHostAndPathname(
                request,
                getBaseHost(hostname),
                mapSubdomainPathToPortal("student", pathname)
            )
        );
    }

    if (isFacultySubdomain) {
        return NextResponse.redirect(
            cloneWithHostAndPathname(
                request,
                getBaseHost(hostname),
                mapSubdomainPathToPortal("faculty", pathname)
            )
        );
    }

    if (pathname === "/admin") {
        return NextResponse.redirect(cloneWithPathname(request, "/admin/login"));
    }

    if (pathname === "/lms/login") {
        return NextResponse.redirect(cloneWithPathname(request, "/student/login"));
    }

    if (pathname === "/lms/teacher/login") {
        return NextResponse.redirect(cloneWithPathname(request, "/faculty/login"));
    }

    if (pathname === "/lms/student" || pathname.startsWith("/lms/student/")) {
        const targetPath = pathname === "/lms/student"
            ? "/student/dashboard"
            : pathname.replace(/^\/lms\/student/, "/student");
        return NextResponse.redirect(cloneWithPathname(request, targetPath));
    }

    if (pathname === "/lms/teacher" || pathname.startsWith("/lms/teacher/")) {
        const targetPath = pathname === "/lms/teacher"
            ? "/faculty/dashboard"
            : pathname.replace(/^\/lms\/teacher/i, "/faculty");
        return NextResponse.redirect(cloneWithPathname(request, targetPath));
    }

    if (pathname === "/student" || pathname === "/student/login") {
        return NextResponse.rewrite(cloneWithPathname(request, "/lms/login"));
    }

    if (pathname.startsWith("/student/")) {
        return NextResponse.rewrite(
            cloneWithPathname(request, pathname.replace(/^\/student/, "/lms/student"))
        );
    }

    if (pathname === "/faculty" || pathname === "/faculty/login") {
        return NextResponse.rewrite(cloneWithPathname(request, "/lms/teacher/login"));
    }

    if (pathname.startsWith("/faculty/")) {
        return NextResponse.rewrite(
            cloneWithPathname(request, pathname.replace(/^\/faculty/, "/lms/teacher"))
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
