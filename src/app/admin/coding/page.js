"use client";

import AdminGuard from "../AdminGuard";
import CodingManager from "./CodingManager";

export default function AdminCodingPage() {
  return (
    <AdminGuard>
      <CodingManager />
    </AdminGuard>
  );
}
