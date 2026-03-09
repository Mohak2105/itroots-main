"use client";

import ProfileSettingsPanel from "@/components/lms/ProfileSettingsPanel";

export default function StudentSettingsPage() {
    return <ProfileSettingsPanel requiredRole="STUDENT" roleLabel="Student" pageTitle="Profile Settings" />;
}
