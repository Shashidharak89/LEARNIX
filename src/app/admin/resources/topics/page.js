import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../../AdminGuard";
import AdminResources from "../AdminResources";

export const metadata = {
  title: "Topics Management | Learnix Admin",
  description: "View and manage all topics, visibilities, and links.",
};

export default function AdminTopicsSubroutePage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}>Loading Topics...</div>}>
          <AdminResources defaultTab="topics" />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
