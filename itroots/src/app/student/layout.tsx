import type { Metadata } from "next";
import { LMSAuthProvider } from "../lms/auth-context";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: {
        default: "ITROOTS LMS - Student Portal",
        template: "%s | ITROOTS LMS",
    },
    description: "ITROOTS Learning Management System - Access your courses, assignments, and progress.",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <LMSAuthProvider>
            <div className="lms-root">{children}</div>
            <Toaster position="top-right" />
        </LMSAuthProvider>
    );
}
