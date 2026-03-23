"use client";

import ProfileSettingsPanel from "@/components/lms/ProfileSettingsPanel";

export default function AdminSettingsPage() {
    return <ProfileSettingsPanel requiredRole="ADMIN" roleLabel="Administrator" pageTitle="Admin Settings" />;
}
