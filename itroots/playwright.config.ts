import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnv } from "./tests/e2e/helpers/env";

loadE2EEnv();

const baseURL = process.env.E2E_BASE_URL?.trim() || "https://example.invalid";

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    workers: 1,
    timeout: 180_000,
    expect: {
        timeout: 20_000,
    },
    reporter: [
        ["list"],
        ["html", { open: "never" }],
    ],
    use: {
        baseURL,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
        video: "retain-on-failure",
        permissions: ["camera", "microphone"],
        launchOptions: {
            args: [
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
            ],
        },
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
        },
    ],
});
