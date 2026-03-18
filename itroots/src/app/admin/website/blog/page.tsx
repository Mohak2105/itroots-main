"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminWebsiteBlogPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/dashboard");
    }, [router]);

    return null;
}
