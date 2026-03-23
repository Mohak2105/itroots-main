import { test, expect } from "@playwright/test";
import {
    apiLogin,
    cleanupAcademicFixture,
    createAcademicFixture,
    createTeacherLiveClass,
    waitForTeacherLiveClassByTitle,
    type AcademicFixture,
} from "./helpers/api";
import { createManagedRolePage, disposeManagedRolePage, type ManagedRolePage } from "./helpers/browserSessions";
import { getE2EConfig } from "./helpers/env";
import { createJitsiLiveClassFromTeacherCalendar } from "./helpers/ui";

const teacherCalendarPath = "/lms/teacher/calendar";
const studentCalendarPath = "/lms/student/calendar";
const teacherLiveClassPath = (liveClassId: string, automation = false) => `/lms/teacher/live-classes/${liveClassId}${automation ? "?e2e=1" : ""}`;
const studentLiveClassPath = (liveClassId: string, automation = false) => `/lms/student/live-classes/${liveClassId}${automation ? "?e2e=1" : ""}`;

const buildIsoOffset = (offsetMinutes: number) => new Date(Date.now() + offsetMinutes * 60_000).toISOString();

async function expectJitsiRoomReady(rolePage: ManagedRolePage) {
    await expect(rolePage.page.getByTestId("live-class-room-info")).toBeVisible();
    await expect(rolePage.page.getByTestId("jitsi-live-room-error")).toHaveCount(0);
    await expect(rolePage.page.locator('[data-testid="jitsi-embed-root"] iframe')).toBeVisible({ timeout: 60_000 });
    await expect(rolePage.page.getByTestId("jitsi-live-room")).toHaveAttribute("data-automation-mode", "true");
    await expect
        .poll(
            async () => rolePage.page.getByTestId("jitsi-live-room").getAttribute("data-joined"),
            { timeout: 90_000 },
        )
        .toBe("true");
}

async function expectLiveClassState(rolePage: ManagedRolePage, expectedState: string) {
    await expect(rolePage.page.getByTestId("live-class-room-state")).toHaveAttribute("data-state", expectedState);
}

test.describe.serial("Jitsi live class E2E", () => {
    test("teacher schedules a Jitsi live class and both teacher and student join the embedded room", async ({ browser, request }, testInfo) => {
        const e2e = getE2EConfig();
        const adminSession = await apiLogin(request, e2e.baseURL, e2e.admin.email, e2e.admin.password);
        const teacherSession = await apiLogin(request, e2e.baseURL, e2e.teacher.email, e2e.teacher.password);
        const studentSession = await apiLogin(request, e2e.baseURL, e2e.student.email, e2e.student.password);

        let fixture: AcademicFixture | null = null;
        let teacherRolePage: ManagedRolePage | null = null;
        let studentRolePage: ManagedRolePage | null = null;

        try {
            fixture = await createAcademicFixture(
                request,
                e2e.baseURL,
                adminSession,
                e2e.teacher.email,
                e2e.student.email,
            );

            teacherRolePage = await createManagedRolePage({
                browser,
                testInfo,
                roleName: "teacher",
                baseURL: e2e.baseURL,
                session: teacherSession,
            });
            studentRolePage = await createManagedRolePage({
                browser,
                testInfo,
                roleName: "student",
                baseURL: e2e.baseURL,
                session: studentSession,
            });

            const liveClassTitle = `${fixture.prefix}-JITSI-HAPPY`;

            await teacherRolePage.page.goto(teacherCalendarPath, { waitUntil: "domcontentloaded" });
            await expect(teacherRolePage.page.getByText("Live Classes")).toBeVisible();

            await createJitsiLiveClassFromTeacherCalendar(teacherRolePage.page, {
                title: liveClassTitle,
                courseTitle: fixture.course.title,
                batchName: fixture.batch.name,
                description: "Playwright Jitsi happy path",
            });

            const createdLiveClass = await waitForTeacherLiveClassByTitle(
                request,
                e2e.baseURL,
                teacherSession,
                liveClassTitle,
            );

            await expect(teacherRolePage.page.getByText(liveClassTitle, { exact: true })).toBeVisible({ timeout: 30_000 });

            await studentRolePage.page.goto(studentCalendarPath, { waitUntil: "domcontentloaded" });
            await expect(studentRolePage.page.getByText("Live Classes")).toBeVisible();
            await expect(studentRolePage.page.getByText(liveClassTitle, { exact: true })).toBeVisible({ timeout: 30_000 });

            await teacherRolePage.page.goto(teacherLiveClassPath(createdLiveClass.id, true), { waitUntil: "domcontentloaded" });
            await expectJitsiRoomReady(teacherRolePage);

            await studentRolePage.page.goto(studentLiveClassPath(createdLiveClass.id, true), { waitUntil: "domcontentloaded" });
            await expectJitsiRoomReady(studentRolePage);
        } finally {
            await disposeManagedRolePage(studentRolePage, testInfo);
            await disposeManagedRolePage(teacherRolePage, testInfo);
            await cleanupAcademicFixture(request, e2e.baseURL, adminSession, fixture);
        }
    });

    test("teacher and student are blocked before start, after expiry, and after the teacher ends the class", async ({ browser, request }, testInfo) => {
        const e2e = getE2EConfig();
        const adminSession = await apiLogin(request, e2e.baseURL, e2e.admin.email, e2e.admin.password);
        const teacherSession = await apiLogin(request, e2e.baseURL, e2e.teacher.email, e2e.teacher.password);
        const studentSession = await apiLogin(request, e2e.baseURL, e2e.student.email, e2e.student.password);

        let fixture: AcademicFixture | null = null;
        let teacherRolePage: ManagedRolePage | null = null;
        let studentRolePage: ManagedRolePage | null = null;

        try {
            fixture = await createAcademicFixture(
                request,
                e2e.baseURL,
                adminSession,
                e2e.teacher.email,
                e2e.student.email,
            );

            const notStartedClass = await createTeacherLiveClass(request, e2e.baseURL, teacherSession, {
                title: `${fixture.prefix}-NOT-STARTED`,
                courseId: fixture.course.id,
                batchId: fixture.batch.id,
                scheduledAt: buildIsoOffset(10),
                provider: "JITSI",
                description: "Before start validation",
            });

            const expiredClass = await createTeacherLiveClass(request, e2e.baseURL, teacherSession, {
                title: `${fixture.prefix}-EXPIRED`,
                courseId: fixture.course.id,
                batchId: fixture.batch.id,
                scheduledAt: buildIsoOffset(-121),
                provider: "JITSI",
                description: "Expired validation",
            });

            const completableClass = await createTeacherLiveClass(request, e2e.baseURL, teacherSession, {
                title: `${fixture.prefix}-COMPLETE`,
                courseId: fixture.course.id,
                batchId: fixture.batch.id,
                scheduledAt: buildIsoOffset(-1),
                provider: "JITSI",
                description: "Teacher completes class",
            });

            teacherRolePage = await createManagedRolePage({
                browser,
                testInfo,
                roleName: "teacher",
                baseURL: e2e.baseURL,
                session: teacherSession,
            });
            studentRolePage = await createManagedRolePage({
                browser,
                testInfo,
                roleName: "student",
                baseURL: e2e.baseURL,
                session: studentSession,
            });

            await teacherRolePage.page.goto(teacherLiveClassPath(notStartedClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(teacherRolePage, "not-started");

            await studentRolePage.page.goto(studentLiveClassPath(notStartedClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(studentRolePage, "not-started");

            await teacherRolePage.page.goto(teacherLiveClassPath(expiredClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(teacherRolePage, "expired");

            await studentRolePage.page.goto(studentLiveClassPath(expiredClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(studentRolePage, "expired");

            await teacherRolePage.page.goto(teacherLiveClassPath(completableClass.id), { waitUntil: "domcontentloaded" });
            await expect(teacherRolePage.page.getByRole("button", { name: /End Live Class/i })).toBeVisible();
            teacherRolePage.page.once("dialog", (dialog) => dialog.accept());
            const completeResponsePromise = teacherRolePage.page.waitForResponse(
                (response) =>
                    response.url().includes(`/api/v1/Faculty/live-classes/${completableClass.id}/complete`)
                    && response.request().method() === "PATCH",
            );
            await teacherRolePage.page.getByRole("button", { name: /End Live Class/i }).click();
            await completeResponsePromise;

            await teacherRolePage.page.goto(teacherLiveClassPath(completableClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(teacherRolePage, "completed");

            await studentRolePage.page.goto(studentLiveClassPath(completableClass.id), { waitUntil: "domcontentloaded" });
            await expectLiveClassState(studentRolePage, "completed");
        } finally {
            await disposeManagedRolePage(studentRolePage, testInfo);
            await disposeManagedRolePage(teacherRolePage, testInfo);
            await cleanupAcademicFixture(request, e2e.baseURL, adminSession, fixture);
        }
    });
});
