"use client";

import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import CodingManager from "./CodingManager";

export default function AdminCodingPage() {
  return (
    <AdminGuard>
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ paddingTop: "5.5rem" }}>
          <CodingManager />
        </div>
      </div>
    </AdminGuard>
  );
}

