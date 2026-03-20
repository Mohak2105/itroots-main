import type { Metadata } from "next";
import { LMSAuthProvider } from "../lms/auth-context";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: {
        default: "ITROOTS LMS - Faculty Portal",
        template: "%s | ITROOTS LMS",
    },
    description: "ITROOTS faculty portal - manage your classes, content, assignments, and student progress.",
};

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
    return (
        <LMSAuthProvider>
            <div className="lms-root">{children}</div>
            <Toaster position="top-right" />
        </LMSAuthProvider>
    );
}
