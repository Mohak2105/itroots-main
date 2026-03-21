import fs from "node:fs";
import path from "node:path";

type RoleCredentials = {
    email: string;
    password: string;
};

export type E2EConfig = {
    baseURL: string;
    admin: RoleCredentials;
    teacher: RoleCredentials;
    student: RoleCredentials;
};

const ENV_FILES = [".env.e2e", ".env.e2e.local"];

let isLoaded = false;

const stripWrappingQuotes = (value: string) => {
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }

    return value;
};

export function loadE2EEnv(cwd: string = process.cwd()) {
    if (isLoaded) return;
    isLoaded = true;

    for (const fileName of ENV_FILES) {
        const filePath = path.join(cwd, fileName);
        if (!fs.existsSync(filePath)) continue;

        const raw = fs.readFileSync(filePath, "utf8");
        for (const rawLine of raw.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith("#")) continue;

            const separatorIndex = line.indexOf("=");
            if (separatorIndex <= 0) continue;

            const key = line.slice(0, separatorIndex).trim();
            const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    }
}

export function requireE2EEnv(name: string) {
    loadE2EEnv();
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(
            `Missing ${name}. Copy .env.e2e.example to .env.e2e and set the HTTPS staging values before running Playwright.`,
        );
    }

    return value;
}

export function getE2EConfig(): E2EConfig {
    const baseURL = requireE2EEnv("E2E_BASE_URL");

    if (!/^https:\/\//i.test(baseURL)) {
        throw new Error(`E2E_BASE_URL must use HTTPS for embedded Jitsi media tests. Received: ${baseURL}`);
    }

    return {
        baseURL,
        admin: {
            email: requireE2EEnv("E2E_ADMIN_EMAIL"),
            password: requireE2EEnv("E2E_ADMIN_PASSWORD"),
        },
        teacher: {
            email: requireE2EEnv("E2E_TEACHER_EMAIL"),
            password: requireE2EEnv("E2E_TEACHER_PASSWORD"),
        },
        student: {
            email: requireE2EEnv("E2E_STUDENT_EMAIL"),
            password: requireE2EEnv("E2E_STUDENT_PASSWORD"),
        },
    };
}
