"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_ORIGIN, ENDPOINTS, FRONTEND_ONLY_MODE } from "@/config/api";
import { USERS } from "@/data/lms-data";

export type UserRole = "SUPER_ADMIN" | "CMS_MANAGER" | "FACULTY" | "STUDENT";

export interface User {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
    specialization?: string;
    role: UserRole;
    isActive: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (identifier: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
    register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; message: string }>;
    impersonate: (user: User, token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<User | null>;
    isLoading: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "itroots_session";
const TOKEN_KEY = "itroots_token";
const MOCK_USERS_KEY = "itroots_mock_users";

type MockUser = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
};

function toPortalRole(role: string): UserRole {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === "FACULTY") return "FACULTY";
    if (normalizedRole === "Faculty") return "FACULTY";
    if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "ADMIN") return "SUPER_ADMIN";
    if (normalizedRole === "CMS_MANAGER" || normalizedRole === "CMS") return "CMS_MANAGER";
    return "STUDENT";
}

function getSeedUsers(): MockUser[] {
    return USERS.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
    }));
}

function getSavedMockUsers(): MockUser[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(MOCK_USERS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMockUsers(users: MockUser[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

export function LMSAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const persistAuthState = useCallback((nextUser: User | null, nextToken?: string | null) => {
        setUser(nextUser);

        if (typeof nextToken !== "undefined") {
            setToken(nextToken);
        }

        if (typeof window === "undefined") {
            return;
        }

        if (nextUser) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }

        if (typeof nextToken !== "undefined") {
            if (nextToken) {
                localStorage.setItem(TOKEN_KEY, nextToken);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        }
    }, []);

    const fetchCurrentUser = useCallback(async (authToken: string) => {
        const response = await fetch(ENDPOINTS.AUTH.ME, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Session expired");
        }

        const data = await response.json();
        persistAuthState(data.user, authToken);
        return data.user as User;
    }, [persistAuthState]);

    useEffect(() => {
        if (typeof window === "undefined") {
            setIsLoading(false);
            return;
        }

        const savedUser = localStorage.getItem(SESSION_KEY);
        const savedToken = localStorage.getItem(TOKEN_KEY);

        if (!savedToken) {
            setIsLoading(false);
            return;
        }

        setToken(savedToken);

        if (FRONTEND_ONLY_MODE) {
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
            setIsLoading(false);
            return;
        }

        void fetchCurrentUser(savedToken)
            .catch(() => {
                persistAuthState(null, null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [fetchCurrentUser, persistAuthState]);

    const login = useCallback(async (identifier: string, password: string) => {
        if (!FRONTEND_ONLY_MODE) {
            try {
                const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ identifier, password }),
                });

                const data = await response.json();
                if (!response.ok) {
                    return {
                        success: false,
                        message: data.message || "Invalid email or password",
                    };
                }

                persistAuthState(data.user, data.token);
                return { success: true, message: "Login successful", user: data.user };
            } catch {
                return { success: false, message: `Backend API is not reachable at ${API_ORIGIN}` };
            }
        }

        const mockUsers = [...getSeedUsers(), ...getSavedMockUsers()];
        const matchedUser = mockUsers.find(
            (u) => (u.email.toLowerCase() === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase()) && u.password === password
        );

        if (!matchedUser) {
            return { success: false, message: "Invalid email or password" };
        }

        const portalUser: User = {
            id: matchedUser.id,
            username: matchedUser.email,
            name: matchedUser.name,
            email: matchedUser.email,
            role: toPortalRole(matchedUser.role),
            isActive: true,
        };

        const mockToken = `mock-token-${matchedUser.id}-${Date.now()}`;
        persistAuthState(portalUser, mockToken);

        return { success: true, message: "Login successful", user: portalUser };
    }, [persistAuthState]);

    const register = useCallback(async (name: string, email: string, password: string, role: string) => {
        if (!FRONTEND_ONLY_MODE) {
            try {
                const response = await fetch(ENDPOINTS.AUTH.REGISTER, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name, email, password, role }),
                });

                const data = await response.json();
                return {
                    success: response.ok,
                    message: data.message || (response.ok ? "Registration successful" : "Registration failed"),
                };
            } catch {
                return { success: false, message: "Backend API is not running on http://localhost:5000" };
            }
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUsers = [...getSeedUsers(), ...getSavedMockUsers()];

        if (existingUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
            return { success: false, message: "Email already registered" };
        }

        const normalizedRole = role.toUpperCase();
        const safeRole = normalizedRole === "FACULTY" || normalizedRole === "Faculty" ? "FACULTY" : "STUDENT";
        const savedUsers = getSavedMockUsers();
        savedUsers.push({
            id: `mock-${Date.now()}`,
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: safeRole,
        });
        saveMockUsers(savedUsers);

        return { success: true, message: "Registration successful. You can sign in now." };
    }, []);

    const refreshUser = useCallback(async () => {
        if (FRONTEND_ONLY_MODE || !token) {
            return user;
        }

        try {
            return await fetchCurrentUser(token);
        } catch {
            persistAuthState(null, null);
            return null;
        }
    }, [fetchCurrentUser, persistAuthState, token, user]);

    const logout = useCallback(() => {
        persistAuthState(null, null);
    }, [persistAuthState]);

    const impersonate = useCallback((newUser: User, newToken: string) => {
        persistAuthState(newUser, newToken);
    }, [persistAuthState]);

    return (
        <AuthContext.Provider value={{ user, login, register, impersonate, logout, refreshUser, isLoading, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useLMSAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useLMSAuth must be used inside LMSAuthProvider");
    return ctx;
}

