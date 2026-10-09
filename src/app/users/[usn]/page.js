import { Navbar } from "@/app/components/Navbar";
import UserDetailsPage from "./UserDetailsPage";
import Footer from "@/app/components/Footer";

export default async function Page({ params }) {
  const { usn } = await params;

  return (
    <div>
      <Navbar />
      <UserDetailsPage usn={usn} />
    </div>
  );
}
