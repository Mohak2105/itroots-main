import type { APIRequestContext, APIResponse } from "@playwright/test";

export type AuthUser = {
    id: string;
    username?: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
};

export type AuthSession = {
    token: string;
    user: AuthUser;
};

export type CourseFixture = {
    id: string;
    title: string;
};

export type BatchFixture = {
    id: string;
    name: string;
    courseId: string;
};

export type LiveClassFixture = {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    provider?: string;
    jitsiRoomName?: string | null;
};

export type AcademicFixture = {
    prefix: string;
    teacher: AuthUser;
    course: CourseFixture;
    batch: BatchFixture;
};

const buildUrl = (baseURL: string, path: string) => new URL(path, baseURL).toString();

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
});

const formatDateOnly = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const readJson = async <T>(response: APIResponse): Promise<T | null> => {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
};

const assertOkJson = async <T>(response: APIResponse, action: string): Promise<T> => {
    const payload = await readJson<T & { message?: string }>(response);

    if (!response.ok()) {
        const message = payload && typeof payload === "object" && "message" in payload
            ? payload.message
            : response.statusText();
        throw new Error(`${action} failed with ${response.status()}: ${message || "Unknown error"}`);
    }

    if (!payload) {
        throw new Error(`${action} returned an empty response body`);
    }

    return payload;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiLogin(
    request: APIRequestContext,
    baseURL: string,
    identifier: string,
    password: string,
): Promise<AuthSession> {
    const response = await request.post(buildUrl(baseURL, "/api/v1/auth/login"), {
        data: { identifier, password },
    });

    return assertOkJson<AuthSession>(response, `Login for ${identifier}`);
}

export async function getFacultyByEmail(
    request: APIRequestContext,
    baseURL: string,
    adminSession: AuthSession,
    teacherEmail: string,
): Promise<AuthUser> {
    const response = await request.get(buildUrl(baseURL, "/api/v1/admin/Faculty"), {
        headers: authHeaders(adminSession.token),
    });
    const teachers = await assertOkJson<AuthUser[]>(response, "Load faculty list");
    const normalizedEmail = teacherEmail.trim().toLowerCase();
    const match = teachers.find((teacher) => teacher.email?.trim().toLowerCase() === normalizedEmail);

    if (!match) {
        throw new Error(`Unable to find the seeded teacher account for ${teacherEmail}`);
    }

    return match;
}

export async function createAcademicFixture(
    request: APIRequestContext,
    baseURL: string,
    adminSession: AuthSession,
    teacherEmail: string,
    studentEmail: string,
): Promise<AcademicFixture> {
    const teacher = await getFacultyByEmail(request, baseURL, adminSession, teacherEmail);
    const prefix = `E2E-LIVECLASS-${Date.now()}`;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const courseResponse = await request.post(buildUrl(baseURL, "/api/v1/admin/courses"), {
        headers: {
            ...authHeaders(adminSession.token),
            "Content-Type": "application/json",
        },
        data: {
            title: `${prefix}-COURSE`,
            category: "Automation",
            duration: "30 Days",
            price: 0,
            instructorId: teacher.id,
            status: "ACTIVE",
        },
    });
    const coursePayload = await assertOkJson<{ course: CourseFixture }>(courseResponse, "Create E2E course");

    const batchResponse = await request.post(buildUrl(baseURL, "/api/v1/admin/batches"), {
        headers: {
            ...authHeaders(adminSession.token),
            "Content-Type": "application/json",
        },
        data: {
            name: `${prefix}-BATCH`,
            courseId: coursePayload.course.id,
            FacultyId: teacher.id,
            schedule: "Mon-Fri 10:00 AM",
            startDate: formatDateOnly(today),
            endDate: formatDateOnly(endDate),
        },
    });
    const batchPayload = await assertOkJson<{ batch: BatchFixture }>(batchResponse, "Create E2E batch");

    const enrollResponse = await request.post(buildUrl(baseURL, "/api/v1/admin/students/enroll"), {
        headers: {
            ...authHeaders(adminSession.token),
            "Content-Type": "application/json",
        },
        data: {
            name: "Demo Student",
            email: studentEmail,
            phone: "9999999999",
            password: "student123",
            batchId: batchPayload.batch.id,
        },
    });
    await assertOkJson(enrollResponse, "Enroll seeded student into E2E batch");

    return {
        prefix,
        teacher,
        course: coursePayload.course,
        batch: batchPayload.batch,
    };
}

export async function createTeacherLiveClass(
    request: APIRequestContext,
    baseURL: string,
    teacherSession: AuthSession,
    input: {
        title: string;
        courseId: string;
        batchId: string;
        scheduledAt: string;
        provider?: "JITSI" | "ZOOM" | "EXTERNAL";
        description?: string;
        meetingLink?: string;
        passcode?: string;
    },
): Promise<LiveClassFixture> {
    const response = await request.post(buildUrl(baseURL, "/api/v1/Faculty/live-classes"), {
        headers: {
            ...authHeaders(teacherSession.token),
            "Content-Type": "application/json",
        },
        data: {
            provider: "JITSI",
            meetingLink: "",
            description: "",
            ...input,
        },
    });
    const payload = await assertOkJson<{ liveClass: LiveClassFixture }>(response, `Create live class ${input.title}`);
    return payload.liveClass;
}

export async function getTeacherLiveClasses(
    request: APIRequestContext,
    baseURL: string,
    teacherSession: AuthSession,
): Promise<LiveClassFixture[]> {
    const response = await request.get(buildUrl(baseURL, "/api/v1/Faculty/live-classes"), {
        headers: authHeaders(teacherSession.token),
    });

    return assertOkJson<LiveClassFixture[]>(response, "Load teacher live classes");
}

export async function waitForTeacherLiveClassByTitle(
    request: APIRequestContext,
    baseURL: string,
    teacherSession: AuthSession,
    title: string,
    timeoutMs: number = 30_000,
): Promise<LiveClassFixture> {
    const deadline = Date.now() + timeoutMs;
    let visibleTitles: string[] = [];

    while (Date.now() < deadline) {
        const liveClasses = await getTeacherLiveClasses(request, baseURL, teacherSession);
        visibleTitles = liveClasses.map((liveClass) => liveClass.title);

        const match = liveClasses.find((liveClass) => liveClass.title === title);
        if (match) {
            return match;
        }

        await sleep(1_000);
    }

    throw new Error(`Timed out waiting for live class "${title}". Teacher live classes: ${visibleTitles.join(", ") || "none"}`);
}

export async function completeTeacherLiveClass(
    request: APIRequestContext,
    baseURL: string,
    teacherSession: AuthSession,
    liveClassId: string,
) {
    const response = await request.patch(buildUrl(baseURL, `/api/v1/Faculty/live-classes/${liveClassId}/complete`), {
        headers: authHeaders(teacherSession.token),
    });

    await assertOkJson(response, `Complete live class ${liveClassId}`);
}

export async function deleteBatch(
    request: APIRequestContext,
    baseURL: string,
    adminSession: AuthSession,
    batchId: string,
) {
    const response = await request.delete(buildUrl(baseURL, `/api/v1/admin/batches/${batchId}`), {
        headers: authHeaders(adminSession.token),
    });

    if (!response.ok() && response.status() !== 404) {
        const payload = await readJson<{ message?: string }>(response);
        throw new Error(`Delete batch ${batchId} failed: ${payload?.message || response.statusText()}`);
    }
}

export async function deleteCourse(
    request: APIRequestContext,
    baseURL: string,
    adminSession: AuthSession,
    courseId: string,
) {
    const response = await request.delete(buildUrl(baseURL, `/api/v1/admin/courses/${courseId}`), {
        headers: authHeaders(adminSession.token),
    });

    if (!response.ok() && response.status() !== 404) {
        const payload = await readJson<{ message?: string }>(response);
        throw new Error(`Delete course ${courseId} failed: ${payload?.message || response.statusText()}`);
    }
}

export async function cleanupAcademicFixture(
    request: APIRequestContext,
    baseURL: string,
    adminSession: AuthSession,
    fixture: AcademicFixture | null,
) {
    if (!fixture) return;

    await deleteBatch(request, baseURL, adminSession, fixture.batch.id);
    await deleteCourse(request, baseURL, adminSession, fixture.course.id);
}
