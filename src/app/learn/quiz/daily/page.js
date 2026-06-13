import { Navbar } from "@/app/components/Navbar";
import DailyQuizClient from "./DailyQuizClient";

export const metadata = {
  title: 'Daily Quiz | LEARNIX',
  description: 'Participate in the daily quiz, compete on the leaderboard!',
};

export default function DailyQuizPage() {
  return (
    <main>
      <Navbar />
      <DailyQuizClient />
    </main>
  );
}
