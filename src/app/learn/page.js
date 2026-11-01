import { Navbar } from "../components/Navbar";
import LearnClient from "./LearnClient";

export const metadata = {
  title: "Learn | LEARNIX",
  description: "Master computer science concepts, explore recommended campus updates and resources, and solve interactive quizzes on LEARNIX.",
};

export default function LearnPage() {
  return (
    <div className="learnix-page-shell">
      <Navbar />
      <LearnClient />
    </div>
  );
}
