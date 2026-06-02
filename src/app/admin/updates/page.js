import AdminGuard from "../AdminGuard";
import AdminUpdates from "./AdminUpdates";

export const metadata = {
    title: "Admin - Updates | Learnix",
};

export default function AdminUpdatesPage() {
    return (
        <AdminGuard>
            <AdminUpdates />
        </AdminGuard>
    );
}
