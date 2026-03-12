import { NextRequest, NextResponse } from 'next/server';

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
    const isFacultySubdomain =
        hostname.toLowerCase().startsWith('faculty.') ||
        hostname.toLowerCase().startsWith('faculty.localhost');

    if (isAdminSubdomain) {
        if (pathname.startsWith('/admin')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        const adminPath = pathname === '/' ? '/admin/login' : `/admin${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = adminPath;
        return NextResponse.rewrite(url);
    }

    if (isStudentSubdomain) {
        if (pathname.startsWith('/lms/student/') || pathname === '/lms/login') return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        const studentPath =
            pathname === '/' || pathname === '/login'
                ? '/lms/login'
                : `/lms/student${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = studentPath;
        return NextResponse.rewrite(url);
    }

    if (isFacultySubdomain) {
        if (pathname.startsWith('/lms/teacher/')) return NextResponse.next();
        if (isStaticPath(pathname)) return NextResponse.next();

        const facultyPath =
            pathname === '/' || pathname === '/login' || pathname === '/lms/login'
                ? '/lms/teacher/login'
                : `/lms/teacher${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = facultyPath;
        return NextResponse.rewrite(url);
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/lms')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
