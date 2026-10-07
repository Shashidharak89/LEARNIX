import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../../AdminGuard";
import AdminResources from "../AdminResources";

export const metadata = {
  title: "Subjects Management | Learnix Admin",
  description: "View and transfer subjects and coupled topics across users.",
};

export default function AdminSubjectsSubroutePage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}>Loading Subjects...</div>}>
          <AdminResources defaultTab="subjects" />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
