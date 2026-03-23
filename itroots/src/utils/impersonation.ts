"use client";

import type { User } from "@/app/lms/auth-context";

export const IMPERSONATION_TRANSFER_PREFIX = "itroots_impersonation_transfer_";
export const TAB_SESSION_KEY = "itroots_tab_session";
export const TAB_TOKEN_KEY = "itroots_tab_token";

type ImpersonationPayload = {
    user: User;
    token: string;
};

export function createImpersonationTransfer(user: User, token: string) {
    if (typeof window === "undefined") {
        return null;
    }

    const bridgeKey = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload: ImpersonationPayload = { user, token };
    localStorage.setItem(`${IMPERSONATION_TRANSFER_PREFIX}${bridgeKey}`, JSON.stringify(payload));
    return bridgeKey;
}

export function consumeImpersonationTransfer(bridgeKey: string) {
    if (typeof window === "undefined") {
        return null;
    }

    const storageKey = `${IMPERSONATION_TRANSFER_PREFIX}${bridgeKey}`;
    const rawPayload = localStorage.getItem(storageKey);
    if (!rawPayload) {
        return null;
    }

    localStorage.removeItem(storageKey);

    try {
        return JSON.parse(rawPayload) as ImpersonationPayload;
    } catch {
        return null;
    }
}
