"use client";

import ProfileSettingsPanel from "@/components/lms/ProfileSettingsPanel";

export default function FacultyettingsPage() {
    return <ProfileSettingsPanel requiredRole="FACULTY" roleLabel="Faculty" pageTitle="Profile Settings" />;
}
