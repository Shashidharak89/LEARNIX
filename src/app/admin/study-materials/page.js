import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import SMAdmin from "./SMAdmin";

export const metadata = {
    title: "Study Materials Management | Learnix Admin",
    description: "Manage Study Materials, Subjects, semesters, courses, colleges, and files",
};

export default function StudyMaterialsAdminPage() {
    return (
        <AdminGuard>
            <div>
                <Navbar />
                <SMAdmin />
            </div>
        </AdminGuard>
    );
}
