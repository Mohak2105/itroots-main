import type { Metadata } from "next";
import { LMSAuthProvider } from "../lms/auth-context";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: {
        default: "ITROOTS Admin — Control Panel",
        template: "%s | ITROOTS Admin",
    },
    description: "ITROOTS Admin Panel — Manage LMS operations and website content.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <LMSAuthProvider>
            <Toaster position="top-right" />
            <div className="lms-root">{children}</div>
        </LMSAuthProvider>
    );
}
