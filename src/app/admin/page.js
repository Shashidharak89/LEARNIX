import { Navbar } from "../components/Navbar";
import AdminDashboard from "./AdminDashboard";
import AdminGuard from "./AdminGuard";

export const metadata = {
    title: "Admin Dashboard | Learnix",
    description: "Learnix Admin Control Panel",
};

export default function AdminPage() {
    return (
        <AdminGuard>
            <div>
                <Navbar />
                <AdminDashboard />
            </div>
        </AdminGuard>
    );
}
