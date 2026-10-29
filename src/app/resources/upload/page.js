import { Navbar } from "@/app/components/Navbar";
import ManageSubjects from "@/app/upload/ManageSubjects";

export const metadata = {
  title: "Upload Resources | Learnix",
  description: "Upload and manage your subjects, topics, and study resources on Learnix.",
  keywords: ["upload resources", "study notes", "learnix notes", "manage subjects"],
};

export default function UploadResourcesPage() {
  return (
    <div>
      <Navbar />
      <ManageSubjects />
    </div>
  );
}
