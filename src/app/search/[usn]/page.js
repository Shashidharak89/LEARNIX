import { Navbar } from "@/app/components/Navbar";
import UserDetailsPage from "./UserDetailsPage";
import Footer from "@/app/components/Footer";

export default function Page({ params }) {
  const { usn } = params||"";

  return (
    <div>
      <Navbar />
      <UserDetailsPage usn={usn} />
      <Footer/>
    </div>
  );
}
