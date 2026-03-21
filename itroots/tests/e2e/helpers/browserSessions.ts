import fs from "node:fs/promises";
import path from "node:path";
import type { Browser, BrowserContext, Page, TestInfo } from "@playwright/test";
import type { AuthSession } from "./api";

const SESSION_KEY = "itroots_session";
const TOKEN_KEY = "itroots_token";

export type ManagedRolePage = {
    roleName: string;
    context: BrowserContext;
    page: Page;
};

const shouldKeepArtifacts = (testInfo: TestInfo) => testInfo.status !== testInfo.expectedStatus;

export async function createManagedRolePage(args: {
    browser: Browser;
    testInfo: TestInfo;
    roleName: string;
    baseURL: string;
    session: AuthSession;
}): Promise<ManagedRolePage> {
    const { browser, testInfo, roleName, baseURL, session } = args;
    const videoDir = path.join(testInfo.outputDir, `${roleName}-video`);

    await fs.mkdir(videoDir, { recursive: true });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        recordVideo: {
            dir: videoDir,
            size: { width: 1440, height: 960 },
        },
    });

    await context.grantPermissions(["camera", "microphone"], {
        origin: new URL(baseURL).origin,
    });

    await context.addInitScript(
        ({ token, user }) => {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        },
        { token: session.token, user: session.user },
    );

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage();

    return { roleName, context, page };
}

export async function disposeManagedRolePage(
    managedRolePage: ManagedRolePage | null,
    testInfo: TestInfo,
) {
    if (!managedRolePage) return;

    const { roleName, context, page } = managedRolePage;
    const keepArtifacts = shouldKeepArtifacts(testInfo);
    const video = page.video();

    if (keepArtifacts && !page.isClosed()) {
        const screenshotPath = testInfo.outputPath(`${roleName}-failure.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        await testInfo.attach(`${roleName}-failure`, {
            path: screenshotPath,
            contentType: "image/png",
        });
    }

    if (keepArtifacts) {
        const tracePath = testInfo.outputPath(`${roleName}-trace.zip`);
        await context.tracing.stop({ path: tracePath });
        await testInfo.attach(`${roleName}-trace`, {
            path: tracePath,
            contentType: "application/zip",
        });
    } else {
        await context.tracing.stop();
    }

    await context.close();

    if (video) {
        const videoPath = await video.path().catch(() => null);
        if (videoPath) {
            if (keepArtifacts) {
                await testInfo.attach(`${roleName}-video`, {
                    path: videoPath,
                    contentType: "video/webm",
                });
            } else {
                await fs.rm(videoPath, { force: true });
            }
        }
    }
}
