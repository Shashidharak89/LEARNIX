import { Navbar } from "@/app/components/Navbar";
import LearnixChatbot from "./LearnixChatBot";

const Page=() => {
  return (
    <div className="chat-page">
        <Navbar/>
        <LearnixChatbot/>
    </div>
  );
}

export default Page;