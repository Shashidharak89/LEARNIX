import { Suspense } from "react";
import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import SearchesManager from "./SearchesManager";

export const metadata = {
  title: "Search History & Keywords | Learnix Admin",
  description: "View real-time keyword searches across Navbar, Home Screen, Study Materials, Question Papers, Updates, and Resources stored in DynamoDB.",
};

export default function AdminSearchesPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>Loading Search Queries...</div>}>
          <SearchesManager />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
