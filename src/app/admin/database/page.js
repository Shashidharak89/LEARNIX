import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import DatabaseManagement from "./DatabaseManagement";

export const metadata = {
  title: "Database Management | Learnix Admin",
  description: "Download CSV database exports with real-time WebSocket progress tracking for public resources, study materials, updates, and users.",
};

export default function AdminDatabasePage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>Loading Database Management...</div>}>
          <DatabaseManagement />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
