import { Navbar } from "@/app/components/Navbar";
import UserDetailsPage from "./UserDetailsPage";

export default function Page({ params }) {
  const { usn } = params;

  return (
    <div>
      <Navbar />
      <UserDetailsPage usn={usn} />
    </div>
  );
}
