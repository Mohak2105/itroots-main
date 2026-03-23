import { LMSAuthProvider } from "../lms/auth-context";
import { Toaster } from "react-hot-toast";

export default function ContentViewerLayout({ children }: { children: React.ReactNode }) {
    return (
        <LMSAuthProvider>
            <div className="lms-root">{children}</div>
            <Toaster position="top-right" />
        </LMSAuthProvider>
    );
}
