"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS, FRONTEND_ONLY_MODE } from "@/config/api";
import { USERS } from "@/data/lms-data";

export type UserRole = "SUPER_ADMIN" | "CMS_MANAGER" | "TEACHER" | "STUDENT";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
    register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
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

    if (normalizedRole === "TEACHER") return "TEACHER";
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

        void fetch(ENDPOINTS.AUTH.ME, {
            headers: {
                Authorization: `Bearer ${savedToken}`,
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Session expired");
                }

                const data = await response.json();
                setUser(data.user);
                localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
            })
            .catch(() => {
                setUser(null);
                setToken(null);
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(TOKEN_KEY);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        if (!FRONTEND_ONLY_MODE) {
            try {
                const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (!response.ok) {
                    return {
                        success: false,
                        message: data.message || "Invalid email or password",
                    };
                }

                setUser(data.user);
                setToken(data.token);
                localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
                localStorage.setItem(TOKEN_KEY, data.token);

                return { success: true, message: "Login successful", user: data.user };
            } catch {
                return { success: false, message: "Backend API is not running on http://localhost:5000" };
            }
        }

        const mockUsers = [...getSeedUsers(), ...getSavedMockUsers()];
        const matchedUser = mockUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!matchedUser) {
            return { success: false, message: "Invalid email or password" };
        }

        const portalUser: User = {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            role: toPortalRole(matchedUser.role),
            isActive: true,
        };

        const mockToken = `mock-token-${matchedUser.id}-${Date.now()}`;
        setUser(portalUser);
        setToken(mockToken);
        localStorage.setItem(SESSION_KEY, JSON.stringify(portalUser));
        localStorage.setItem(TOKEN_KEY, mockToken);

        return { success: true, message: "Login successful", user: portalUser };
    }, []);

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

        const safeRole = role.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT";
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

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useLMSAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useLMSAuth must be used inside LMSAuthProvider");
    return ctx;
}
