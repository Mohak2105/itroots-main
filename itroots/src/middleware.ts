import { NextRequest, NextResponse } from 'next/server';

// Shared static-asset bypass check
function isStaticPath(pathname: string) {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    );
}

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;

    const isAdminSubdomain = hostname.startsWith('admin.') || hostname.startsWith('admin.localhost');
    const isStudentSubdomain = hostname.startsWith('student.') || hostname.startsWith('student.localhost');
    const isTeacherSubdomain = hostname.startsWith('teacher.') || hostname.startsWith('teacher.localhost');

    // ── Admin subdomain: admin.itroots.com → /admin/* ──────────────────────
    if (isAdminSubdomain) {
        if (pathname.startsWith('/admin')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        const adminPath = pathname === '/' ? '/admin/login' : `/admin${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = adminPath;
        return NextResponse.rewrite(url);
    }

    // ── Student subdomain: student.itroots.com → /lms/student/* ────────────
    if (isStudentSubdomain) {
        // Allow already-correct internal paths (router.push after login uses full /lms/ paths)
        if (pathname.startsWith('/lms/')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        // / or /login → student login page; everything else → /lms/student/*
        const studentPath =
            pathname === '/' || pathname === '/login'
                ? '/lms/login'
                : `/lms/student${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = studentPath;
        return NextResponse.rewrite(url);
    }

    // ── Teacher subdomain: teacher.itroots.com → /lms/teacher/* ────────────
    if (isTeacherSubdomain) {
        // Allow already-correct internal paths
        if (pathname.startsWith('/lms/')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        // / or /login → teacher login page; everything else → /lms/teacher/*
        const teacherPath =
            pathname === '/' || pathname === '/login'
                ? '/lms/teacher/login'
                : `/lms/teacher${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = teacherPath;
        return NextResponse.rewrite(url);
    }

    // ── Main domain: block direct /admin/* and /lms/* access ───────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/lms')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and API routes
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
