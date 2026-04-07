import { Navbar } from "@/app/components/Navbar";
import ChatThreadPage from "./ChatThreadPage";

export default async function Page({ params }) {
  const { userId } = await params;

  return (
    <div>
      <Navbar />
      <ChatThreadPage userId={userId} />
    </div>
  );
}
