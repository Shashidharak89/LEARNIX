import { Navbar } from "../../components/Navbar";
import AdminUsers from "./AdminUsers";
import AdminGuard from "../AdminGuard";

export const metadata = {
  title: "User Management | Learnix Admin",
  description: "Manage all registered users",
};

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <AdminUsers />
      </div>
    </AdminGuard>
  );
}
