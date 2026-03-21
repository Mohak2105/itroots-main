import { expect, type Page } from "@playwright/test";

export async function selectCustomSelectOption(page: Page, testId: string, optionLabel: string) {
    await page.getByTestId(`${testId}-trigger`).click();
    await expect(page.getByTestId(`${testId}-menu`)).toBeVisible();
    await page.getByRole("option", { name: optionLabel, exact: true }).click();
    await expect(page.getByTestId(`${testId}-menu`)).toBeHidden();
}

export async function setCurrentDateTime(page: Page, testId: string = "live-class-scheduled-at") {
    await page.getByTestId(`${testId}-trigger`).click();
    await expect(page.getByTestId(`${testId}-panel`)).toBeVisible();
    await page.getByTestId(`${testId}-use-current-time`).click();
    await page.getByTestId(`${testId}-done`).click();
    await expect(page.getByTestId(`${testId}-panel`)).toBeHidden();
}

export async function createJitsiLiveClassFromTeacherCalendar(page: Page, input: {
    title: string;
    courseTitle: string;
    batchName: string;
    description?: string;
}) {
    await page.getByTestId("open-live-class-modal").click();
    await expect(page.getByTestId("live-class-form-modal")).toBeVisible();

    await page.getByTestId("live-class-title-input").fill(input.title);
    await selectCustomSelectOption(page, "live-class-course", input.courseTitle);
    await selectCustomSelectOption(page, "live-class-batch", input.batchName);
    await selectCustomSelectOption(page, "live-class-provider", "Jitsi Meeting");
    await setCurrentDateTime(page);

    if (input.description) {
        await page.getByTestId("live-class-description-input").fill(input.description);
    }

    await page.getByTestId("save-live-class").click();
    await expect(page.getByTestId("live-class-form-modal")).toBeHidden({ timeout: 20_000 });
}
