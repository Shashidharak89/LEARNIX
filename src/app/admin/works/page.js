import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import AdminWorks from "./AdminWorks";

export const metadata = {
  title: "Works Management | Learnix Admin",
  description: "Manage work records, visibilities, and custom download links.",
};

export default function AdminWorksPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <AdminWorks />
      </div>
    </AdminGuard>
  );
}
