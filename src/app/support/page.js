import { Navbar } from "../components/Navbar";
import SupportChat from "./SupportChat";

export const metadata = {
  title: "Support | Learnix",
  description: "Chat with the Learnix support bot for instant help.",
};

export default function SupportPage() {
  return (
    <>
      <Navbar />
      
      <SupportChat />
    </>
  );
}
