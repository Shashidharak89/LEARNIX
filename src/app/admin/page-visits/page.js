import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import PageVisitsManager from "./PageVisitsManager";

export const metadata = {
  title: "Page Visits | Learnix Admin",
  description: "Daily page visit analytics for Learnix.",
};

export default function AdminPageVisitsPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>Loading page visits…</div>}>
          <PageVisitsManager />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
