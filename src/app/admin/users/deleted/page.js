"use client";

import AdminGuard from "@/app/admin/AdminGuard";
import DeletedUsers from "./DeletedUsers";
import { Navbar } from "@/app/components/Navbar";

export default function DeletedUsersPage() {
  return (
    <AdminGuard>
      <Navbar />
      <DeletedUsers />
    </AdminGuard>
  );
}
