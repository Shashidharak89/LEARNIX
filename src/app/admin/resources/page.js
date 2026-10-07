import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import AdminResources from "./AdminResources";

export const metadata = {
  title: "Resource Management | Learnix Admin",
  description: "Manage subjects, topics, visibilities, and ownership transfers across users.",
};

export default function AdminResourcesPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}>Loading Resource Management...</div>}>
          <AdminResources />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
