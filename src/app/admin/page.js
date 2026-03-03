import { Navbar } from "../components/Navbar";
import AdminDashboard from "./AdminDashboard";

export const metadata = {
    title: "Admin Dashboard | Learnix",
    description: "Learnix Admin Control Panel",
};

export default function AdminPage() {
    return (
        <div>
            <Navbar />
            <AdminDashboard />
        </div>
    );
}
