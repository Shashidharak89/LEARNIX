import { Navbar } from "../../components/Navbar";
import AdminUsers from "./AdminUsers";

export const metadata = {
  title: "User Management | Learnix Admin",
  description: "Manage all registered users",
};

export default function AdminUsersPage() {
  return (
    <div>
      <Navbar />
      <AdminUsers />
    </div>
  );
}
