import { Navbar } from "@/app/components/Navbar";
import LearnixChatbot from "./LearnixChatBot";
import TestAPI from "./TestAPI";

const Page=() => {
  return (
    <div className="chat-page">
        <Navbar/>
        <LearnixChatbot/>
        <TestAPI/>
    </div>
  );
}

export default Page;