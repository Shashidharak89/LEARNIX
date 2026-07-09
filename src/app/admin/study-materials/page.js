import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import SMAdmin from "./SMAdmin";
import SMViewer from "./SMViewer";

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
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 40px 24px" }}>
                    <SMViewer />
                </div>
            </div>
        </AdminGuard>
    );
}
