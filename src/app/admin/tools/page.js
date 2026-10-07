import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import AdminTools from "./AdminTools";

export const metadata = {
  title: "Tools Management | Learnix Admin",
  description: "Inspect uploaded files, retrieve shared texts, and manage storage records.",
};

export default function AdminToolsPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}>Loading Tools Management...</div>}>
          <AdminTools />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
