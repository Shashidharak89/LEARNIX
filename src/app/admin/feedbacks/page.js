import { Navbar } from "../../components/Navbar";
import AdminGuard from "../AdminGuard";
import AdminFeedbacks from "./AdminFeedbacks";

export const metadata = {
  title: "Feedbacks | Learnix Admin",
  description: "View all user feedback submissions",
};

export default function AdminFeedbacksPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <AdminFeedbacks />
      </div>
    </AdminGuard>
  );
}
