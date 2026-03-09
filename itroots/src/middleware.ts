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
    const isFacultyubdomain = hostname.startsWith('Faculty.') || hostname.startsWith('Faculty.localhost');

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

    // ── Faculty subdomain: Faculty.itroots.com → /lms/Faculty/* ────────────
    if (isFacultyubdomain) {
        // Allow already-correct internal paths
        if (pathname.startsWith('/lms/')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        // / or /login → Faculty login page; everything else → /lms/Faculty/*
        const FacultyPath =
            pathname === '/' || pathname === '/login'
                ? '/lms/Faculty/login'
                : `/lms/Faculty${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = FacultyPath;
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
