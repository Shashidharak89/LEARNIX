"use client";

import AdminGuard from "@/app/admin/AdminGuard";
import AdminUserProfile from "./AdminUserProfile";
import { Navbar } from "@/app/components/Navbar";

export default function AdminUserProfilePage({ params }) {
    return (
        <AdminGuard>
            <Navbar />
            <AdminUserProfile params={params} />
        </AdminGuard>
    );
}
