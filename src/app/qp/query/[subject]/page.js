import { Navbar } from "@/app/components/Navbar";
import SubjectViewer from "./SubjectViewer";

export default function SubjectViewerPage({ params }) {
  return (
    <>
      <Navbar />
      <SubjectViewer params={params} />
    </>
  );
}
