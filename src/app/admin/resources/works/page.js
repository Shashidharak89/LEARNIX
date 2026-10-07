import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../../AdminGuard";
import AdminResources from "../AdminResources";

export const metadata = {
  title: "Works Moderation | Learnix Admin",
  description: "Moderation of work records, visibilities, and custom download links.",
};

export default function AdminWorksSubroutePage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}>Loading Works Moderation...</div>}>
          <AdminResources defaultTab="works" />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
